import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewFlagSchema } from "@/lib/validations";
import { successResponse, handleApiError } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { recordReputationEvent, applyLabel } from "@/services/integrity";

// GET /api/admin/flags - List flags
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || "PENDING";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status !== "ALL") where.status = status;

    const [flags, total] = await Promise.all([
      db.flag.findMany({
        where,
        include: {
          article: {
            select: { id: true, title: true, slug: true, authorId: true },
          },
          reporter: { select: { id: true, displayName: true, email: true } },
          reviewer: { select: { displayName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      db.flag.count({ where }),
    ]);

    return successResponse({
      flags,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/admin/flags - Review a flag
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const data = reviewFlagSchema.parse(body);

    const flag = await db.flag.findUnique({
      where: { id: data.flagId },
      include: { article: true },
    });

    if (!flag) {
      return successResponse({ error: "Flag not found" });
    }

    await db.flag.update({
      where: { id: data.flagId },
      data: {
        status: data.status,
        reviewedBy: admin.id,
        reviewNote: data.reviewNote,
        reviewedAt: new Date(),
      },
    });

    // If upheld, apply consequences
    if (data.status === "UPHELD" && flag.article) {
      // Reputation penalty for article author
      await recordReputationEvent(flag.article.authorId, "FLAG_UPHELD_AGAINST", {
        articleId: flag.articleId,
        reason: `Flag upheld: ${flag.reason}`,
      });

      // Apply appropriate label based on flag reason
      if (flag.reason === "MISSING_SOURCE") {
        await applyLabel(flag.articleId, "NEEDS_SOURCE", admin.id, data.reviewNote);
      } else if (flag.reason === "INACCURATE" || flag.reason === "MISLEADING") {
        await applyLabel(flag.articleId, "DISPUTED", admin.id, data.reviewNote);
      }
    }

    await auditLog({
      userId: admin.id,
      action: "flag_reviewed",
      entity: "Flag",
      entityId: data.flagId,
      details: { status: data.status, reviewNote: data.reviewNote },
    });

    return successResponse({ message: "Flag reviewed" });
  } catch (error) {
    return handleApiError(error);
  }
}
