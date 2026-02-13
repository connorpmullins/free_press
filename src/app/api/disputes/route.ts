import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createDisputeSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { applyLabel } from "@/services/integrity";

// POST /api/disputes - Submit a dispute
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = createDisputeSchema.parse(body);

    // Check article exists and is published
    const article = await db.article.findUnique({
      where: { id: data.articleId },
    });

    if (!article || article.status !== "PUBLISHED") {
      return errorResponse("Article not found", 404);
    }

    // Authors can't dispute their own articles
    if (article.authorId === user.id) {
      return errorResponse("You cannot dispute your own article", 400);
    }

    // Check for existing active dispute from this user
    const existingDispute = await db.dispute.findFirst({
      where: {
        articleId: data.articleId,
        submitterId: user.id,
        status: { in: ["OPEN", "UNDER_REVIEW"] },
      },
    });

    if (existingDispute) {
      return errorResponse("You already have an active dispute on this article", 400);
    }

    const dispute = await db.dispute.create({
      data: {
        articleId: data.articleId,
        submitterId: user.id,
        reason: data.reason,
        evidence: data.evidence,
      },
    });

    // Apply "Disputed" label to the article
    await applyLabel(
      data.articleId,
      "DISPUTED",
      user.id,
      `Dispute submitted: ${data.reason.substring(0, 100)}`
    );

    await auditLog({
      userId: user.id,
      action: "dispute_submitted",
      entity: "Dispute",
      entityId: dispute.id,
      details: { articleId: data.articleId },
    });

    return successResponse({ dispute: { id: dispute.id } }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/disputes - Get disputes (for admin or article author)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = request.nextUrl;
    const articleId = searchParams.get("articleId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (user.role !== "ADMIN") {
      // Non-admins can only see disputes on their own articles or their own disputes
      where.OR = [
        { submitterId: user.id },
        { article: { authorId: user.id } },
      ];
    }

    if (articleId) where.articleId = articleId;
    if (status) where.status = status;

    const disputes = await db.dispute.findMany({
      where,
      include: {
        article: { select: { title: true, slug: true } },
        submitter: { select: { displayName: true } },
        reviewer: { select: { displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ disputes });
  } catch (error) {
    return handleApiError(error);
  }
}
