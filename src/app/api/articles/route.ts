import { NextRequest } from "next/server";
import { requireJournalist, getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createArticleSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { assessSourceCompleteness, assessContentRisk } from "@/services/integrity";
import { recordReputationEvent } from "@/services/integrity";
import { indexArticle } from "@/lib/search";

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 80) +
    "-" +
    Date.now().toString(36)
  );
}

// GET /api/articles - List articles (public, paginated)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const authorId = searchParams.get("authorId");
    const status = searchParams.get("status") || "PUBLISHED";
    const offset = (page - 1) * limit;

    const session = await getSession();
    const isAdmin = session?.user.role === "ADMIN";
    const isOwnArticles = authorId && session?.user.id === authorId;

    // Only published articles are public
    const where: Record<string, unknown> = {};

    if (status === "PUBLISHED" || (!isAdmin && !isOwnArticles)) {
      where.status = "PUBLISHED";
    } else if (isOwnArticles || isAdmin) {
      if (status !== "ALL") {
        where.status = status;
      }
    }

    if (authorId) {
      where.authorId = authorId;
    }

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        include: {
          author: {
            include: {
              journalistProfile: {
                select: {
                  pseudonym: true,
                  reputationScore: true,
                  verificationStatus: true,
                  avatarUrl: true,
                },
              },
            },
          },
          sources: { select: { id: true, sourceType: true, title: true } },
          integrityLabels: {
            where: { active: true },
            select: { labelType: true, reason: true },
          },
          corrections: {
            where: { status: "PUBLISHED" },
            select: { id: true, severity: true, createdAt: true },
          },
          _count: {
            select: {
              flags: { where: { status: "PENDING" } },
              bookmarks: true,
            },
          },
        },
        orderBy: { publishedAt: "desc" },
        skip: offset,
        take: limit,
      }),
      db.article.count({ where }),
    ]);

    return successResponse({
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        summary: a.summary,
        status: a.status,
        version: a.version,
        publishedAt: a.publishedAt,
        createdAt: a.createdAt,
        sourceComplete: a.sourceComplete,
        author: {
          id: a.authorId,
          pseudonym: a.author.journalistProfile?.pseudonym ?? "Unknown",
          reputationScore: a.author.journalistProfile?.reputationScore ?? 50,
          verified:
            a.author.journalistProfile?.verificationStatus === "VERIFIED",
          avatarUrl: a.author.journalistProfile?.avatarUrl,
        },
        sources: a.sources,
        integrityLabels: a.integrityLabels.map((l) => l.labelType),
        correctionCount: a.corrections.length,
        flagCount: a._count.flags,
        bookmarkCount: a._count.bookmarks,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/articles - Create article (journalist only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireJournalist();
    const body = await request.json();
    const data = createArticleSchema.parse(body);

    // Check journalist profile exists and is verified
    const profile = await db.journalistProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile || profile.verificationStatus !== "VERIFIED") {
      return errorResponse(
        "You must complete identity verification before publishing",
        403
      );
    }

    const slug = generateSlug(data.title);

    // Create article with sources in a transaction
    const article = await db.$transaction(async (tx: any) => {
      const newArticle = await tx.article.create({
        data: {
          authorId: user.id,
          title: data.title,
          slug,
          summary: data.summary,
          content: data.content,
          contentText: data.contentText,
          status: "DRAFT",
          claimCount: 0,
        },
      });

      // Create sources
      if (data.sources && data.sources.length > 0) {
        await tx.source.createMany({
          data: data.sources.map((s) => ({
            articleId: newArticle.id,
            sourceType: s.sourceType,
            quality: s.quality,
            url: s.url || null,
            title: s.title,
            description: s.description,
            isAnonymous: s.isAnonymous,
          })),
        });
      }

      // Create initial version
      await tx.articleVersion.create({
        data: {
          articleId: newArticle.id,
          version: 1,
          title: data.title,
          content: data.content,
          summary: data.summary,
          changedBy: user.id,
          changeNote: "Initial draft",
        },
      });

      return newArticle;
    });

    await auditLog({
      userId: user.id,
      action: "article_created",
      entity: "Article",
      entityId: article.id,
    });

    return successResponse({ article: { id: article.id, slug } }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
