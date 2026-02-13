import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/bookmarks - Get user's bookmarks
export async function GET() {
  try {
    const user = await requireAuth();

    const bookmarks = await db.bookmark.findMany({
      where: { userId: user.id },
      include: {
        article: {
          include: {
            author: {
              include: {
                journalistProfile: {
                  select: { pseudonym: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        createdAt: b.createdAt,
        article: {
          id: b.article.id,
          title: b.article.title,
          slug: b.article.slug,
          summary: b.article.summary,
          publishedAt: b.article.publishedAt,
          authorPseudonym:
            b.article.author.journalistProfile?.pseudonym ?? "Unknown",
        },
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/bookmarks - Toggle bookmark
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { articleId } = await request.json();

    if (!articleId) {
      return errorResponse("articleId is required", 400);
    }

    const existing = await db.bookmark.findUnique({
      where: { userId_articleId: { userId: user.id, articleId } },
    });

    if (existing) {
      await db.bookmark.delete({
        where: { id: existing.id },
      });
      return successResponse({ bookmarked: false });
    } else {
      await db.bookmark.create({
        data: { userId: user.id, articleId },
      });
      return successResponse({ bookmarked: true });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
