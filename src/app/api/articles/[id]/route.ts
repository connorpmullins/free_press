import { NextRequest } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateArticleSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { syncArticleInSearch, removeArticleFromIndex } from "@/lib/search";

// GET /api/articles/[id] - Get single article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const article = await db.article.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        author: {
          include: {
            journalistProfile: {
              select: {
                id: true,
                pseudonym: true,
                bio: true,
                beats: true,
                reputationScore: true,
                verificationStatus: true,
                avatarUrl: true,
                articleCount: true,
              },
            },
          },
        },
        sources: true,
        integrityLabels: {
          where: { active: true },
          orderBy: { createdAt: "desc" },
        },
        corrections: {
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
        },
        versions: {
          orderBy: { version: "desc" },
          take: 10,
          select: {
            version: true,
            changeNote: true,
            createdAt: true,
          },
        },
        _count: {
          select: { bookmarks: true },
        },
      },
    });

    if (!article) {
      return errorResponse("Article not found", 404);
    }

    // Only published/removed articles are public (unless author or admin)
    const isAuthor = session?.user.id === article.authorId;
    const isAdmin = session?.user.role === "ADMIN";

    if (!["PUBLISHED", "REMOVED"].includes(article.status) && !isAuthor && !isAdmin) {
      return errorResponse("Article not found", 404);
    }

    // Check subscription for full content
    const hasSubscription =
      session?.user &&
      (await db.subscription.findFirst({
        where: { userId: session.user.id, status: "ACTIVE" },
      }));

    const isSubscriber = !!hasSubscription || isAuthor || isAdmin;

    return successResponse({
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      content: isSubscriber ? article.content : null,
      contentText: isSubscriber ? article.contentText : null,
      contentPreview: !isSubscriber,
      status: article.status,
      version: article.version,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      sourceComplete: article.sourceComplete,
      author: {
        id: article.authorId,
        pseudonym: article.author.journalistProfile?.pseudonym ?? "Unknown",
        bio: article.author.journalistProfile?.bio,
        beats: article.author.journalistProfile?.beats,
        reputationScore:
          article.author.journalistProfile?.reputationScore ?? 50,
        verified:
          article.author.journalistProfile?.verificationStatus === "VERIFIED",
        avatarUrl: article.author.journalistProfile?.avatarUrl,
        articleCount: article.author.journalistProfile?.articleCount ?? 0,
      },
      sources: article.sources,
      integrityLabels: article.integrityLabels,
      corrections: article.corrections,
      versionHistory: article.versions,
      bookmarkCount: article._count.bookmarks,
      isBookmarked: session?.user
        ? !!(await db.bookmark.findUnique({
            where: {
              userId_articleId: {
                userId: session.user.id,
                articleId: article.id,
              },
            },
          }))
        : false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/articles/[id] - Update article (author only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();
    const data = updateArticleSchema.parse(body);

    const article = await db.article.findUnique({ where: { id } });

    if (!article) {
      return errorResponse("Article not found", 404);
    }

    if (article.authorId !== user.id && user.role !== "ADMIN") {
      return errorResponse("Not authorized", 403);
    }

    // Drafts and submitted can be freely edited; published articles require a changeNote
    if (!["DRAFT", "SUBMITTED", "PUBLISHED"].includes(article.status) && user.role !== "ADMIN") {
      return errorResponse(
        "This article cannot be edited in its current state.",
        400
      );
    }

    if (article.status === "PUBLISHED" && user.role !== "ADMIN") {
      if (!data.changeNote || data.changeNote.trim().length === 0) {
        return errorResponse(
          "A change note is required when editing a published article.",
          400
        );
      }
    }

    const newVersion = article.version + 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma interactive transaction client type is not exported
    const updated = await db.$transaction(async (tx: any) => {
      const updatedArticle = await tx.article.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.summary !== undefined && { summary: data.summary }),
          ...(data.content && { content: data.content }),
          ...(data.contentText && { contentText: data.contentText }),
          version: newVersion,
        },
      });

      // Create version record
      await tx.articleVersion.create({
        data: {
          articleId: id,
          version: newVersion,
          title: data.title ?? article.title,
          content: data.content ?? article.content,
          summary: data.summary ?? article.summary,
          changedBy: user.id,
          changeNote: data.changeNote ?? "Content updated",
        },
      });

      return updatedArticle;
    });

    await auditLog({
      userId: user.id,
      action: "article_updated",
      entity: "Article",
      entityId: id,
      details: { version: newVersion },
    });

    // Keep search index updated if a published article changes.
    if (updated.status === "PUBLISHED") {
      try {
        await syncArticleInSearch(updated.id);
      } catch {
        // Search sync failures should not block content updates.
      }
    }

    return successResponse({ article: { id: updated.id, version: newVersion } });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/articles/[id] - Delete draft article (author only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const article = await db.article.findUnique({ where: { id } });

    if (!article) {
      return errorResponse("Article not found", 404);
    }

    if (article.authorId !== user.id && user.role !== "ADMIN") {
      return errorResponse("Not authorized", 403);
    }

    // Only drafts and submitted articles can be deleted
    if (!["DRAFT", "SUBMITTED"].includes(article.status)) {
      return errorResponse(
        "Only draft or submitted articles can be deleted. Use withdraw for published articles.",
        400
      );
    }

    // Hard delete — cascaded relations (versions, sources) are cleaned up by Prisma
    await db.article.delete({ where: { id } });

    // Remove from search index if it was somehow indexed
    try {
      await removeArticleFromIndex(id);
    } catch {
      // Ignore search index errors
    }

    await auditLog({
      userId: user.id,
      action: "article_deleted",
      entity: "Article",
      entityId: id,
      details: { title: article.title, previousStatus: article.status },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
