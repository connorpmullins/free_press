import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import type { RevenueEntryStatus } from "@prisma/client";

// ============================================================
// Revenue Calculation Engine
// ============================================================
// Revenue allocation:
//   - Platform margin: configurable (default 15%)
//   - Journalist pool: remaining 85%
//   - Weighted by: reads * integrity multiplier

const DEFAULT_PLATFORM_MARGIN = 0.15;

async function getPlatformMargin(): Promise<number> {
  const config = await db.platformConfig.findUnique({
    where: { id: "default" },
  });
  return config?.platformMargin ?? DEFAULT_PLATFORM_MARGIN;
}

// ============================================================
// Integrity Multiplier
// ============================================================

function calculateIntegrityMultiplier(
  reputationScore: number,
  correctionCount: number,
  disputeCount: number
): number {
  // Base multiplier from reputation (0.5 - 1.5)
  let multiplier = 0.5 + (reputationScore / 100);

  // Correction penalty (minor: -0.05, per major: -0.15)
  multiplier -= correctionCount * 0.05;

  // Dispute penalty
  multiplier -= disputeCount * 0.1;

  // Clamp between 0.1 and 1.5
  return Math.max(0.1, Math.min(1.5, multiplier));
}

// ============================================================
// Monthly Revenue Calculation
// ============================================================

export async function calculateMonthlyRevenue(
  period: string // YYYY-MM
): Promise<{
  totalRevenue: number;
  platformShare: number;
  journalistPool: number;
  entries: Array<{
    journalistId: string;
    pseudonym: string;
    articles: number;
    totalReads: number;
    integrityMultiplier: number;
    weightedReads: number;
    amount: number;
  }>;
}> {
  const margin = await getPlatformMargin();

  // Get active subscriptions for the period
  const activeSubscriptions = await db.subscription.count({
    where: { status: "ACTIVE" },
  });

  // Calculate total revenue (simplified - in production, use actual Stripe data)
  const config = await db.platformConfig.findUnique({
    where: { id: "default" },
  });

  const monthlyPrice = (config?.monthlyPrice ?? 500) / 100; // Convert cents to dollars
  const totalRevenue = activeSubscriptions * monthlyPrice;
  const platformShare = totalRevenue * margin;
  const journalistPool = totalRevenue - platformShare;

  // Get all published articles for the period
  const [year, month] = period.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const journalists = await db.journalistProfile.findMany({
    where: {
      verificationStatus: "VERIFIED",
    },
    include: {
      user: {
        include: {
          articles: {
            where: {
              status: "PUBLISHED",
              publishedAt: {
                gte: startDate,
                lte: endDate,
              },
            },
            include: {
              corrections: { where: { status: "PUBLISHED" } },
              disputes: { where: { status: "UPHELD" } },
            },
          },
        },
      },
    },
  });

  const readRows = await db.auditLog.groupBy({
    by: ["entityId"],
    where: {
      action: "article_read",
      entity: "Article",
      entityId: { not: null },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: { _all: true },
  });
  const readsByArticleId = new Map<string, number>();
  for (const row of readRows) {
    if (row.entityId) {
      readsByArticleId.set(row.entityId, row._count._all);
    }
  }

  // Calculate weighted reads for each journalist
  const journalistData = journalists
    .filter((j) => j.user.articles.length > 0)
    .map((j) => {
      const totalCorrectionCount = j.user.articles.reduce(
        (sum, a) => sum + a.corrections.length,
        0
      );
      const totalDisputeCount = j.user.articles.reduce(
        (sum, a) => sum + a.disputes.length,
        0
      );

      const integrityMultiplier = calculateIntegrityMultiplier(
        j.reputationScore,
        totalCorrectionCount,
        totalDisputeCount
      );

      const totalReads = j.user.articles.reduce(
        (sum, article) => sum + (readsByArticleId.get(article.id) ?? 0),
        0
      );
      const weightedReads = totalReads * integrityMultiplier;

      return {
        journalistId: j.id,
        pseudonym: j.pseudonym,
        articles: j.user.articles.length,
        totalReads,
        integrityMultiplier,
        weightedReads,
      };
    });

  // Calculate total weighted reads
  const totalWeightedReads = journalistData.reduce(
    (sum, j) => sum + j.weightedReads,
    0
  );

  // Distribute pool proportionally
  const entries = journalistData.map((j) => ({
    ...j,
    amount:
      totalWeightedReads > 0
        ? (j.weightedReads / totalWeightedReads) * journalistPool
        : 0,
  }));

  return {
    totalRevenue,
    platformShare,
    journalistPool,
    entries,
  };
}

// ============================================================
// Create Revenue Entries in DB
// ============================================================

export async function generateRevenueEntries(
  period: string
): Promise<void> {
  const result = await calculateMonthlyRevenue(period);

  // Check for existing entries
  const existing = await db.revenueEntry.count({
    where: { period },
  });

  if (existing > 0) {
    throw new Error(
      `Revenue entries for ${period} already exist. Delete them first to recalculate.`
    );
  }

  // Create entries
  for (const entry of result.entries) {
    await db.revenueEntry.create({
      data: {
        journalistId: entry.journalistId,
        period,
        amount: Math.round(entry.amount * 100) / 100, // Round to cents
        reads: entry.totalReads,
        integrityMultiplier: entry.integrityMultiplier,
        status: "CALCULATED",
      },
    });
  }

  await auditLog({
    action: "revenue_calculated",
    entity: "RevenueEntry",
    details: {
      period,
      totalRevenue: result.totalRevenue,
      platformShare: result.platformShare,
      journalistPool: result.journalistPool,
      journalistCount: result.entries.length,
    },
  });
}

// ============================================================
// Revenue Queries
// ============================================================

export async function getJournalistRevenue(
  journalistId: string,
  options?: { limit?: number; offset?: number }
): Promise<{
  entries: Array<{
    id: string;
    period: string;
    amount: number;
    reads: number;
    integrityMultiplier: number;
    status: RevenueEntryStatus;
    paidAt: Date | null;
  }>;
  totalEarnings: number;
  pendingEarnings: number;
}> {
  const entries = await db.revenueEntry.findMany({
    where: { journalistId },
    orderBy: { period: "desc" },
    take: options?.limit || 12,
    skip: options?.offset || 0,
  });

  const totalEarnings = await db.revenueEntry.aggregate({
    where: { journalistId, status: "PAID" },
    _sum: { amount: true },
  });

  const pendingEarnings = await db.revenueEntry.aggregate({
    where: {
      journalistId,
      status: { in: ["CALCULATED", "PENDING"] },
    },
    _sum: { amount: true },
  });

  return {
    entries: entries.map((e) => ({
      id: e.id,
      period: e.period,
      amount: e.amount,
      reads: e.reads,
      integrityMultiplier: e.integrityMultiplier,
      status: e.status,
      paidAt: e.paidAt,
    })),
    totalEarnings: totalEarnings._sum.amount ?? 0,
    pendingEarnings: pendingEarnings._sum.amount ?? 0,
  };
}

// ============================================================
// Revenue Distribution (Gini Coefficient)
// ============================================================

export function calculateGiniCoefficient(amounts: number[]): number {
  if (amounts.length === 0) return 0;
  if (amounts.length === 1) return 0;

  const sorted = [...amounts].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((sum, x) => sum + x, 0) / n;

  if (mean === 0) return 0;

  let sumDifferences = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      sumDifferences += Math.abs(sorted[i] - sorted[j]);
    }
  }

  return sumDifferences / (2 * n * n * mean);
}
