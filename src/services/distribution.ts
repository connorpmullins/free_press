import { db } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import type { ArticleStatus } from "@prisma/client";

// ============================================================
// Distribution Engine
// ============================================================
// Reputation-weighted ranking algorithm for the article feed.
// Higher reputation = broader distribution.
// Integrity signals modulate reach.

interface RankedArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: Date | null;
  authorId: string;
  authorPseudonym: string;
  authorReputationScore: number;
  authorVerified: boolean;
  sourceCount: number;
  sourceComplete: boolean;
  integrityLabels: string[];
  correctionCount: number;
  distributionScore: number;
}

// ============================================================
// Scoring Algorithm
// ============================================================

export interface ScoringFactors {
  reputationScore: number; // 0-100
  sourceCompleteness: boolean;
  sourceCount: number;
  labelPenalties: number; // Sum of label-based penalties
  correctionCount: number;
  ageHours: number; // Hours since publication
  flagCount: number;
}

export function calculateDistributionScore(factors: ScoringFactors): number {
  let score = 0;

  // Base score from reputation (0-40 points)
  score += (factors.reputationScore / 100) * 40;

  // Source quality (0-25 points)
  if (factors.sourceCompleteness) {
    score += 15;
  }
  score += Math.min(10, factors.sourceCount * 2.5);

  // Recency bonus (0-20 points, decays over 72 hours)
  const recencyDecay = Math.max(0, 1 - factors.ageHours / 72);
  score += recencyDecay * 20;

  // Integrity penalties
  score -= factors.labelPenalties;

  // Correction penalty
  score -= factors.correctionCount * 2;

  // Flag penalty
  score -= factors.flagCount * 1.5;

  // Clamp between 0-100
  return Math.max(0, Math.min(100, score));
}

// ============================================================
// Feed Generation
// ============================================================

export async function getFeed(options?: {
  limit?: number;
  offset?: number;
  authorId?: string;
}): Promise<{ articles: RankedArticle[]; total: number }> {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const cacheKey = `feed:${options?.authorId || "all"}:${offset}:${limit}`;

  // Try cache first (short TTL for feed freshness)
  const cached = await cacheGet<{ articles: RankedArticle[]; total: number }>(
    cacheKey
  );
  if (cached) return cached;

  // Build where clause
  const where: Record<string, unknown> = {
    status: "PUBLISHED" as ArticleStatus,
    publishedAt: { not: null },
  };

  if (options?.authorId) {
    where.authorId = options.authorId;
  }

  // Get total count
  const total = await db.article.count({ where });

  // Fetch articles with all scoring data
  const articles = await db.article.findMany({
    where,
    include: {
      author: {
        include: {
          journalistProfile: {
            select: {
              pseudonym: true,
              reputationScore: true,
              verificationStatus: true,
            },
          },
        },
      },
      sources: { select: { id: true } },
      integrityLabels: {
        where: { active: true },
        select: { labelType: true },
      },
      corrections: {
        where: { status: "PUBLISHED" },
        select: { id: true },
      },
      flags: {
        where: { status: "PENDING" },
        select: { id: true },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: limit * 3, // Fetch extra to re-rank
  });

  // Score and rank
  const now = new Date();
  const rankedArticles: RankedArticle[] = articles
    .map((article) => {
      const profile = article.author.journalistProfile;
      // Use the most recent of publishedAt or lastCorrectedAt for recency
      const publishedTime = article.publishedAt?.getTime() || now.getTime();
      const correctedTime = article.lastCorrectedAt?.getTime() || 0;
      const effectiveTime = Math.max(publishedTime, correctedTime);
      const ageHours = (now.getTime() - effectiveTime) / (1000 * 60 * 60);

      // Calculate label penalties
      const labelPenalties = article.integrityLabels.reduce((sum, label) => {
        switch (label.labelType) {
          case "DISPUTED":
            return sum + 10;
          case "NEEDS_SOURCE":
            return sum + 5;
          case "UNDER_REVIEW":
            return sum + 8;
          default:
            return sum;
        }
      }, 0);

      const distributionScore = calculateDistributionScore({
        reputationScore: profile?.reputationScore ?? 50,
        sourceCompleteness: article.sourceComplete,
        sourceCount: article.sources.length,
        labelPenalties,
        correctionCount: article.corrections.length,
        ageHours,
        flagCount: article.flags.length,
      });

      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        publishedAt: article.publishedAt,
        authorId: article.authorId,
        authorPseudonym: profile?.pseudonym ?? "Unknown",
        authorReputationScore: profile?.reputationScore ?? 50,
        authorVerified: profile?.verificationStatus === "VERIFIED",
        sourceCount: article.sources.length,
        sourceComplete: article.sourceComplete,
        integrityLabels: article.integrityLabels.map((l) => l.labelType),
        correctionCount: article.corrections.length,
        distributionScore,
      };
    })
    .sort((a, b) => b.distributionScore - a.distributionScore)
    .slice(offset, offset + limit);

  const result = { articles: rankedArticles, total };

  // Cache for 60 seconds
  await cacheSet(cacheKey, result, 60);

  return result;
}

// ============================================================
// Chronological Feed (Non-personalized option)
// ============================================================

export async function getChronologicalFeed(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ articles: RankedArticle[]; total: number }> {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  const where = {
    status: "PUBLISHED" as ArticleStatus,
    publishedAt: { not: null as unknown as undefined },
  };

  const total = await db.article.count({ where });

  const articles = await db.article.findMany({
    where,
    include: {
      author: {
        include: {
          journalistProfile: {
            select: {
              pseudonym: true,
              reputationScore: true,
              verificationStatus: true,
            },
          },
        },
      },
      sources: { select: { id: true } },
      integrityLabels: {
        where: { active: true },
        select: { labelType: true },
      },
      corrections: {
        where: { status: "PUBLISHED" },
        select: { id: true },
      },
    },
    orderBy: { publishedAt: "desc" },
    skip: offset,
    take: limit,
  });

  const rankedArticles: RankedArticle[] = articles.map((article) => {
    const profile = article.author.journalistProfile;

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      publishedAt: article.publishedAt,
      authorId: article.authorId,
      authorPseudonym: profile?.pseudonym ?? "Unknown",
      authorReputationScore: profile?.reputationScore ?? 50,
      authorVerified: profile?.verificationStatus === "VERIFIED",
      sourceCount: article.sources.length,
      sourceComplete: article.sourceComplete,
      integrityLabels: article.integrityLabels.map((l) => l.labelType),
      correctionCount: article.corrections.length,
      distributionScore: 0, // Not relevant for chronological
    };
  });

  return { articles: rankedArticles, total };
}
