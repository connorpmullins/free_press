import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveDisputeSchema } from "@/lib/validations";
import { successResponse, handleApiError } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { recordReputationEvent, removeLabel } from "@/services/integrity";

// GET /api/admin/disputes - List disputes
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || "OPEN";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status !== "ALL") where.status = status;

    const [disputes, total] = await Promise.all([
      db.dispute.findMany({
        where,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              authorId: true,
              author: {
                select: {
                  displayName: true,
                  journalistProfile: { select: { pseudonym: true } },
                },
              },
            },
          },
          submitter: { select: { id: true, displayName: true } },
          reviewer: { select: { displayName: true } },
          appeal: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      db.dispute.count({ where }),
    ]);

    return successResponse({
      disputes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/admin/disputes - Resolve a dispute
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const data = resolveDisputeSchema.parse(body);

    const dispute = await db.dispute.findUnique({
      where: { id: data.disputeId },
      include: { article: true },
    });

    if (!dispute) {
      return successResponse({ error: "Dispute not found" });
    }

    await db.dispute.update({
      where: { id: data.disputeId },
      data: {
        status: data.status,
        reviewedBy: admin.id,
        resolution: data.resolution,
        resolvedAt: new Date(),
      },
    });

    // Apply reputation consequences
    if (data.status === "UPHELD" && dispute.article) {
      // Dispute upheld = article author gets reputation penalty
      await recordReputationEvent(
        dispute.article.authorId,
        "DISPUTE_UPHELD_AGAINST",
        {
          articleId: dispute.articleId,
          reason: `Dispute upheld: ${data.resolution.substring(0, 100)}`,
        }
      );
    } else if (data.status === "OVERTURNED") {
      // Dispute overturned = remove the disputed label
      const disputeLabels = await db.integrityLabel.findMany({
        where: {
          articleId: dispute.articleId,
          labelType: "DISPUTED",
          active: true,
        },
      });

      for (const label of disputeLabels) {
        await removeLabel(label.id, admin.id);
      }

      // Give author back some reputation
      if (dispute.article) {
        await recordReputationEvent(
          dispute.article.authorId,
          "DISPUTE_OVERTURNED_FOR",
          {
            articleId: dispute.articleId,
            reason: "Dispute overturned in author's favor",
          }
        );
      }
    }

    await auditLog({
      userId: admin.id,
      action: "dispute_resolved",
      entity: "Dispute",
      entityId: data.disputeId,
      details: { status: data.status, resolution: data.resolution },
    });

    return successResponse({ message: "Dispute resolved" });
  } catch (error) {
    return handleApiError(error);
  }
}
