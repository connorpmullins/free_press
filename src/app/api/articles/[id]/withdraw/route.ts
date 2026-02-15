import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { withdrawArticleSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { removeArticleFromIndex } from "@/lib/search";

// POST /api/articles/[id]/withdraw - Withdraw a published article
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();
    const data = withdrawArticleSchema.parse(body);

    const article = await db.article.findUnique({ where: { id } });

    if (!article) {
      return errorResponse("Article not found", 404);
    }

    if (article.authorId !== user.id && user.role !== "ADMIN") {
      return errorResponse("Not authorized", 403);
    }

    if (article.status !== "PUBLISHED") {
      return errorResponse(
        "Only published articles can be withdrawn.",
        400
      );
    }

    // Set status to REMOVED
    await db.article.update({
      where: { id },
      data: { status: "REMOVED" },
    });

    // Decrement journalist profile article count
    await db.journalistProfile.update({
      where: { userId: article.authorId },
      data: { articleCount: { decrement: 1 } },
    });

    // Remove from search index
    try {
      await removeArticleFromIndex(id);
    } catch {
      // Search sync failures should not block withdrawal
    }

    await auditLog({
      userId: user.id,
      action: "article_withdrawn",
      entity: "Article",
      entityId: id,
      details: { title: article.title, reason: data.reason },
    });

    return successResponse({
      status: "REMOVED",
      message: "Article has been withdrawn.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
