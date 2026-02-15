import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCorrectionSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { processCorrectionReputation } from "@/services/integrity";

// POST /api/corrections - Issue a correction
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = createCorrectionSchema.parse(body);

    // Check article exists and user is author
    const article = await db.article.findUnique({
      where: { id: data.articleId },
    });

    if (!article) {
      return errorResponse("Article not found", 404);
    }

    if (article.authorId !== user.id && user.role !== "ADMIN") {
      return errorResponse("Only the author or admins can issue corrections", 403);
    }

    if (article.status !== "PUBLISHED") {
      return errorResponse("Corrections can only be issued for published articles", 400);
    }

    const correction = await db.correction.create({
      data: {
        articleId: data.articleId,
        authorId: user.id,
        content: data.content,
        severity: data.severity,
        status: "PUBLISHED", // Author-initiated corrections are auto-published
      },
    });

    // Bump article recency so corrected articles resurface in the feed
    await db.article.update({
      where: { id: data.articleId },
      data: { lastCorrectedAt: new Date() },
    });

    // Process reputation impact
    await processCorrectionReputation(user.id, data.severity, data.articleId);

    await auditLog({
      userId: user.id,
      action: "correction_issued",
      entity: "Correction",
      entityId: correction.id,
      details: { articleId: data.articleId, severity: data.severity },
    });

    return successResponse({ correction: { id: correction.id } }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
