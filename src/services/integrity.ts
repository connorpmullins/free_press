import { db } from "@/lib/db";
import { cacheDel, cacheGet, cacheSet } from "@/lib/redis";
import { auditLog } from "@/lib/audit";
import type {
  ReputationEventType,
  CorrectionSeverity,
  Article,
} from "@prisma/client";

// ============================================================
// Reputation Score Configuration
// ============================================================

const REPUTATION_DELTAS: Record<ReputationEventType, number> = {
  ARTICLE_PUBLISHED: 2.0,
  ARTICLE_CITED: 1.5,
  SOURCE_COMPLETE: 1.0,
  CORRECTION_ISSUED_MINOR: -0.5,
  CORRECTION_ISSUED_MAJOR: -3.0,
  DISPUTE_UPHELD_AGAINST: -5.0,
  DISPUTE_OVERTURNED_FOR: 2.0,
  FLAG_UPHELD_AGAINST: -2.0,
  TENURE_BONUS: 0.5,
  MANUAL_ADJUSTMENT: 0, // Set manually
};

const MIN_REPUTATION = 0;
const MAX_REPUTATION = 100;
const DEFAULT_REPUTATION = 50;

// ============================================================
// Reputation Scoring
// ============================================================

export async function getReputationScore(userId: string): Promise<number> {
  const cacheKey = `reputation:${userId}`;
  const cached = await cacheGet<number>(cacheKey);
  if (cached !== null) return cached;

  const profile = await db.journalistProfile.findUnique({
    where: { userId },
    select: { reputationScore: true },
  });

  const score = profile?.reputationScore ?? DEFAULT_REPUTATION;
  await cacheSet(cacheKey, score, 300);
  return score;
}

export async function recordReputationEvent(
  userId: string,
  type: ReputationEventType,
  options?: {
    delta?: number;
    reason?: string;
    articleId?: string;
  }
): Promise<number> {
  const delta = options?.delta ?? REPUTATION_DELTAS[type];

  // Record the event
  await db.reputationEvent.create({
    data: {
      userId,
      type,
      delta,
      reason: options?.reason,
      articleId: options?.articleId,
    },
  });

  // Update the journalist profile score
  const profile = await db.journalistProfile.findUnique({
    where: { userId },
  });

  if (profile) {
    const newScore = Math.min(
      MAX_REPUTATION,
      Math.max(MIN_REPUTATION, profile.reputationScore + delta)
    );

    await db.journalistProfile.update({
      where: { userId },
      data: { reputationScore: newScore },
    });

    // Clear cache
    await cacheDel(`reputation:${userId}`);

    await auditLog({
      userId,
      action: "reputation_change",
      entity: "JournalistProfile",
      entityId: profile.id,
      details: { type, delta, newScore, reason: options?.reason },
    });

    return newScore;
  }

  return DEFAULT_REPUTATION;
}

// ============================================================
// Source Completeness Assessment
// ============================================================

export function assessSourceCompleteness(
  article: Article & { sources: { sourceType: string; quality: string; url: string | null }[] }
): {
  complete: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 0;
  const maxScore = 100;

  const sources = article.sources;

  if (sources.length === 0) {
    return { complete: false, score: 0, issues: ["No sources attached"] };
  }

  // Has at least one source: +20
  score += 20;

  // Has primary source: +30
  const hasPrimary = sources.some(
    (s) => s.quality === "PRIMARY" || s.sourceType === "PRIMARY_DOCUMENT"
  );
  if (hasPrimary) {
    score += 30;
  } else {
    issues.push("No primary sources");
  }

  // Has URLs for non-anonymous sources: +20
  const nonAnonymous = sources.filter(
    (s) => s.quality !== "ANONYMOUS" && s.quality !== "UNVERIFIABLE"
  );
  const withUrls = nonAnonymous.filter((s) => s.url && s.url.length > 0);
  if (nonAnonymous.length > 0) {
    const urlRatio = withUrls.length / nonAnonymous.length;
    score += Math.round(urlRatio * 20);
    if (urlRatio < 1) {
      issues.push("Some non-anonymous sources missing URLs");
    }
  } else {
    score += 10; // All anonymous - partial credit
    issues.push("All sources are anonymous or unverifiable");
  }

  // Multiple sources: +15
  if (sources.length >= 2) {
    score += 15;
  } else {
    issues.push("Single source only");
  }

  // Diverse source types: +15
  const uniqueTypes = new Set(sources.map((s) => s.sourceType));
  if (uniqueTypes.size >= 2) {
    score += 15;
  }

  return {
    complete: score >= 50,
    score: Math.min(maxScore, score),
    issues,
  };
}

// ============================================================
// High-Risk Content Detection
// ============================================================

export interface RiskAssessment {
  riskLevel: "low" | "medium" | "high";
  triggers: string[];
  shouldHold: boolean;
}

export function assessContentRisk(
  title: string,
  contentText: string,
  sourceCompleteness: number
): RiskAssessment {
  const triggers: string[] = [];
  let riskLevel: "low" | "medium" | "high" = "low";

  const text = `${title} ${contentText}`.toLowerCase();

  // Check for named individual + allegation patterns
  const allegationPatterns = [
    /allege[sd]?\s/i,
    /accus[ed]+\sof/i,
    /charged\swith/i,
    /investigation\s(into|of)/i,
    /misconduct/i,
    /corruption/i,
    /fraud/i,
    /criminal/i,
    /scandal/i,
    /cover.?up/i,
    /sexual\s(assault|harassment|abuse)/i,
  ];

  const hasAllegation = allegationPatterns.some((p) => p.test(text));

  if (hasAllegation) {
    triggers.push("Contains allegation language");
    riskLevel = "medium";
  }

  // Weak sourcing + allegation = high risk
  if (hasAllegation && sourceCompleteness < 50) {
    triggers.push("Allegation with insufficient sourcing");
    riskLevel = "high";
  }

  // Very weak sourcing alone
  if (sourceCompleteness < 20) {
    triggers.push("Very weak sourcing");
    if (riskLevel === "low") riskLevel = "medium";
  }

  return {
    riskLevel,
    triggers,
    shouldHold: riskLevel === "high",
  };
}

// ============================================================
// Integrity Label Management
// ============================================================

export async function applyLabel(
  articleId: string,
  labelType: "SUPPORTED" | "DISPUTED" | "NEEDS_SOURCE" | "CORRECTION_ISSUED" | "UNDER_REVIEW",
  appliedBy: string,
  reason?: string
): Promise<void> {
  await db.integrityLabel.create({
    data: {
      articleId,
      labelType,
      appliedBy,
      reason,
    },
  });

  await auditLog({
    userId: appliedBy,
    action: "label_applied",
    entity: "Article",
    entityId: articleId,
    details: { labelType, reason },
  });
}

export async function removeLabel(
  labelId: string,
  removedBy: string
): Promise<void> {
  await db.integrityLabel.update({
    where: { id: labelId },
    data: { active: false, removedAt: new Date() },
  });

  await auditLog({
    userId: removedBy,
    action: "label_removed",
    entity: "IntegrityLabel",
    entityId: labelId,
  });
}

export async function getActiveLabels(articleId: string) {
  return db.integrityLabel.findMany({
    where: { articleId, active: true },
    orderBy: { createdAt: "desc" },
  });
}

// ============================================================
// Correction Processing
// ============================================================

export async function processCorrectionReputation(
  authorId: string,
  severity: CorrectionSeverity,
  articleId: string
): Promise<void> {
  const eventType: ReputationEventType =
    severity === "TYPO" || severity === "CLARIFICATION"
      ? "CORRECTION_ISSUED_MINOR"
      : "CORRECTION_ISSUED_MAJOR";

  await recordReputationEvent(authorId, eventType, {
    articleId,
    reason: `Correction issued: ${severity}`,
  });

  // Apply correction label
  await applyLabel(articleId, "CORRECTION_ISSUED", authorId, `Severity: ${severity}`);
}
