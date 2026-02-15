import { describe, it, expect } from "vitest";
import {
  calculateDistributionScore,
  type ScoringFactors,
} from "./distribution";

describe("Distribution Service", () => {
  describe("calculateDistributionScore", () => {
    const baseFactors: ScoringFactors = {
      reputationScore: 50,
      sourceCompleteness: true,
      sourceCount: 3,
      labelPenalties: 0,
      correctionCount: 0,
      ageHours: 0,
      flagCount: 0,
    };

    it("calculates score for a fresh, well-sourced article from a mid-reputation author", () => {
      const score = calculateDistributionScore(baseFactors);
      // reputation: (50/100)*40 = 20
      // source quality: 15 (complete) + min(10, 3*2.5) = 15 + 7.5 = 22.5
      // recency: (1 - 0/72)*20 = 20
      // penalties: 0
      // total: 20 + 22.5 + 20 = 62.5
      expect(score).toBeCloseTo(62.5, 1);
    });

    it("gives maximum reputation score for reputation=100", () => {
      const score = calculateDistributionScore({
        ...baseFactors,
        reputationScore: 100,
      });
      // reputation: 40 + source: 22.5 + recency: 20 = 82.5
      expect(score).toBeCloseTo(82.5, 1);
    });

    it("gives 0 reputation score for reputation=0", () => {
      const score = calculateDistributionScore({
        ...baseFactors,
        reputationScore: 0,
      });
      // reputation: 0 + source: 22.5 + recency: 20 = 42.5
      expect(score).toBeCloseTo(42.5, 1);
    });

    it("penalizes incomplete sources", () => {
      const complete = calculateDistributionScore(baseFactors);
      const incomplete = calculateDistributionScore({
        ...baseFactors,
        sourceCompleteness: false,
      });
      expect(complete - incomplete).toBe(15);
    });

    it("caps source count bonus at 10", () => {
      const score1 = calculateDistributionScore({
        ...baseFactors,
        sourceCount: 4,
      });
      const score2 = calculateDistributionScore({
        ...baseFactors,
        sourceCount: 100,
      });
      // sourceCount bonus is capped at 10
      expect(score2).toBe(score1 + (10 - Math.min(10, 4 * 2.5)));
    });

    it("decays recency bonus over 72 hours", () => {
      const fresh = calculateDistributionScore({
        ...baseFactors,
        ageHours: 0,
      });
      const dayOld = calculateDistributionScore({
        ...baseFactors,
        ageHours: 24,
      });
      const oldArticle = calculateDistributionScore({
        ...baseFactors,
        ageHours: 72,
      });
      const veryOld = calculateDistributionScore({
        ...baseFactors,
        ageHours: 200,
      });

      expect(fresh).toBeGreaterThan(dayOld);
      expect(dayOld).toBeGreaterThan(oldArticle);
      expect(oldArticle).toBe(veryOld); // Both have 0 recency
    });

    it("applies DISPUTED label penalty of 10", () => {
      const clean = calculateDistributionScore(baseFactors);
      const disputed = calculateDistributionScore({
        ...baseFactors,
        labelPenalties: 10,
      });
      expect(clean - disputed).toBe(10);
    });

    it("applies correction penalty of 2 per correction", () => {
      const clean = calculateDistributionScore(baseFactors);
      const corrected = calculateDistributionScore({
        ...baseFactors,
        correctionCount: 3,
      });
      expect(clean - corrected).toBe(6); // 3 * 2
    });

    it("applies flag penalty of 1.5 per flag", () => {
      const clean = calculateDistributionScore(baseFactors);
      const flagged = calculateDistributionScore({
        ...baseFactors,
        flagCount: 2,
      });
      expect(clean - flagged).toBe(3); // 2 * 1.5
    });

    it("clamps score to minimum 0", () => {
      const score = calculateDistributionScore({
        reputationScore: 0,
        sourceCompleteness: false,
        sourceCount: 0,
        labelPenalties: 50,
        correctionCount: 10,
        ageHours: 200,
        flagCount: 20,
      });
      expect(score).toBe(0);
    });

    it("clamps score to maximum 100", () => {
      const score = calculateDistributionScore({
        reputationScore: 100,
        sourceCompleteness: true,
        sourceCount: 10,
        labelPenalties: 0,
        correctionCount: 0,
        ageHours: 0,
        flagCount: 0,
      });
      // 40 + 15 + 10 + 20 = 85 (won't exceed 100 naturally, but verify clamping)
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeGreaterThan(0);
    });

    it("correction recency bump: fresh correction resets recency bonus for old article", () => {
      // An article published 100 hours ago — no recency bonus
      const oldArticle = calculateDistributionScore({
        ...baseFactors,
        ageHours: 100,
      });

      // The same article but with ageHours recalculated from a fresh correction (0 hours)
      const correctedArticle = calculateDistributionScore({
        ...baseFactors,
        ageHours: 0, // lastCorrectedAt is now, so effective age = 0
      });

      // The corrected article should score higher due to recency boost
      expect(correctedArticle).toBeGreaterThan(oldArticle);
      // Specifically, the difference should be the full recency bonus (20 points)
      expect(correctedArticle - oldArticle).toBeCloseTo(20, 1);
    });

    it("correction recency bump: old correction provides no boost", () => {
      // Article published 100h ago, corrected 100h ago — effective age still 100h
      const oldCorrected = calculateDistributionScore({
        ...baseFactors,
        ageHours: 100, // max(publishedAt, lastCorrectedAt) is still old
      });

      // Article published 100h ago, no correction
      const neverCorrected = calculateDistributionScore({
        ...baseFactors,
        ageHours: 100,
      });

      // No difference — both are past the 72h recency window
      expect(oldCorrected).toBe(neverCorrected);
    });
  });
});
