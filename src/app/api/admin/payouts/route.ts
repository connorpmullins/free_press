import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPayout } from "@/lib/stripe";
import { generateRevenueEntries } from "@/services/revenue";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

function currentPeriod(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// POST /api/admin/payouts - Generate revenue entries and optionally execute payouts
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const period = typeof body.period === "string" ? body.period : currentPeriod();
    const execute = body.execute === true;

    try {
      await generateRevenueEntries(period);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to generate entries";
      if (!msg.includes("already exist")) {
        throw error;
      }
    }

    if (!execute) {
      return successResponse({
        period,
        generated: true,
        executed: false,
        message: "Revenue entries prepared. Re-run with execute=true to create transfers.",
      });
    }

    const entries = await db.revenueEntry.findMany({
      where: { period, status: "CALCULATED" },
      include: {
        journalist: {
          select: { stripeConnectId: true, userId: true },
        },
      },
    });

    let paid = 0;
    let failed = 0;

    for (const entry of entries) {
      if (!entry.journalist.stripeConnectId) {
        await db.revenueEntry.update({
          where: { id: entry.id },
          data: { status: "FAILED" },
        });
        failed += 1;
        continue;
      }

      const transferId = await createPayout(
        entry.journalist.stripeConnectId,
        entry.amount,
        `Free Press payout ${period}`
      );

      if (!transferId) {
        await db.revenueEntry.update({
          where: { id: entry.id },
          data: { status: "FAILED" },
        });
        failed += 1;
        continue;
      }

      await db.revenueEntry.update({
        where: { id: entry.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      paid += 1;
    }

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "payout_run",
        entity: "RevenueEntry",
        details: { period, paid, failed },
      },
    });

    return successResponse({ period, generated: true, executed: true, paid, failed });
  } catch (error) {
    return handleApiError(error);
  }
}
