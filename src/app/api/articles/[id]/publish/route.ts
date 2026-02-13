import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import {
  assessSourceCompleteness,
  assessContentRisk,
  recordReputationEvent,
  applyLabel,
} from "@/services/integrity";
import { indexArticle } from "@/lib/search";

// POST /api/articles/[id]/publish - Publish article
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const article = await db.article.findUnique({
      where: { id },
      include: {
        sources: true,
        author: {
          include: {
            journalistProfile: {
              select: { pseudonym: true, reputationScore: true },
            },
          },
        },
      },
    });

    if (!article) {
      return errorResponse("Article not found", 404);
    }

    if (article.authorId !== user.id && user.role !== "ADMIN") {
      return errorResponse("Not authorized", 403);
    }

    if (article.status === "PUBLISHED") {
      return errorResponse("Article is already published", 400);
    }

    if (article.status === "REMOVED") {
      return errorResponse("Removed articles cannot be republished", 400);
    }

    // Assess source completeness
    const sourceAssessment = assessSourceCompleteness(article);

    // Assess content risk
    const riskAssessment = assessContentRisk(
      article.title,
      article.contentText,
      sourceAssessment.score
    );

    // If high risk, hold for review instead of publishing
    if (riskAssessment.shouldHold) {
      await db.article.update({
        where: { id },
        data: {
          status: "HELD",
          sourceComplete: sourceAssessment.complete,
        },
      });

      await applyLabel(id, "UNDER_REVIEW", user.id, "Automatically held for review");

      await auditLog({
        userId: user.id,
        action: "article_held",
        entity: "Article",
        entityId: id,
        details: {
          riskLevel: riskAssessment.riskLevel,
          triggers: riskAssessment.triggers,
        },
      });

      return successResponse({
        status: "HELD",
        message:
          "Your article has been held for review due to content that requires additional scrutiny. Our team will review it within 72 hours.",
        riskTriggers: riskAssessment.triggers,
      });
    }

    // Publish the article
    await db.article.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        sourceComplete: sourceAssessment.complete,
      },
    });

    // Apply "Needs Source" label if sourcing is incomplete
    if (!sourceAssessment.complete) {
      await applyLabel(id, "NEEDS_SOURCE", user.id, sourceAssessment.issues.join("; "));
    }

    // Record reputation event
    await recordReputationEvent(user.id, "ARTICLE_PUBLISHED", {
      articleId: id,
    });

    if (sourceAssessment.complete) {
      await recordReputationEvent(user.id, "SOURCE_COMPLETE", {
        articleId: id,
      });
    }

    // Update journalist profile article count
    await db.journalistProfile.update({
      where: { userId: user.id },
      data: { articleCount: { increment: 1 } },
    });

    // Index in Meilisearch
    try {
      await indexArticle({
        id: article.id,
        title: article.title,
        summary: article.summary,
        contentText: article.contentText,
        authorId: article.authorId,
        authorName: article.author.journalistProfile?.pseudonym ?? "Unknown",
        status: "PUBLISHED",
        publishedAt: new Date().toISOString(),
        integrityLabels: sourceAssessment.complete ? [] : ["NEEDS_SOURCE"],
        reputationScore:
          article.author.journalistProfile?.reputationScore ?? 50,
      });
    } catch {
      // Search indexing failure shouldn't block publishing
    }

    await auditLog({
      userId: user.id,
      action: "article_published",
      entity: "Article",
      entityId: id,
      details: {
        sourceScore: sourceAssessment.score,
        riskLevel: riskAssessment.riskLevel,
      },
    });

    return successResponse({
      status: "PUBLISHED",
      slug: article.slug,
      sourceAssessment: {
        complete: sourceAssessment.complete,
        score: sourceAssessment.score,
        issues: sourceAssessment.issues,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
