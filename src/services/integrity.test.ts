import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrismaClient } from "@/test/setup";

// Import after mocks are set up
import {
  assessSourceCompleteness,
  assessContentRisk,
  getReputationScore,
  recordReputationEvent,
  applyLabel,
  removeLabel,
  getActiveLabels,
  processCorrectionReputation,
} from "./integrity";

import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";
import { auditLog } from "@/lib/audit";

describe("Integrity Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // assessSourceCompleteness
  // ============================================================

  describe("assessSourceCompleteness", () => {
    const baseArticle = {
      id: "article-1",
      authorId: "user-1",
      title: "Test Article",
      slug: "test-article",
      summary: null,
      content: {},
      contentText: "Test content text for the article that is long enough.",
      status: "DRAFT" as const,
      version: 1,
      sourceComplete: false,
      claimCount: 0,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("returns 0 score and incomplete for article with no sources", () => {
      const result = assessSourceCompleteness({
        ...baseArticle,
        sources: [],
      });
      expect(result.complete).toBe(false);
      expect(result.score).toBe(0);
      expect(result.issues).toContain("No sources attached");
    });

    it("scores a single anonymous source at 30 (has source + partial anonymous credit)", () => {
      const result = assessSourceCompleteness({
        ...baseArticle,
        sources: [
          { sourceType: "INTERVIEW", quality: "ANONYMOUS", url: null },
        ],
      });
      // 20 (has source) + 0 (no primary) + 10 (all anonymous) + 0 (single source) = 30
      expect(result.score).toBe(30);
      expect(result.complete).toBe(false);
      expect(result.issues).toContain("No primary sources");
      expect(result.issues).toContain("All sources are anonymous or unverifiable");
      expect(result.issues).toContain("Single source only");
    });

    it("gives high score for well-sourced article", () => {
      const result = assessSourceCompleteness({
        ...baseArticle,
        sources: [
          {
            sourceType: "PRIMARY_DOCUMENT",
            quality: "PRIMARY",
            url: "https://example.com/doc",
          },
          {
            sourceType: "INTERVIEW",
            quality: "SECONDARY",
            url: "https://example.com/interview",
          },
        ],
      });
      // 20 (has source) + 30 (primary) + 20 (all URLs) + 15 (multiple) + 15 (diverse types) = 100
      expect(result.score).toBe(100);
      expect(result.complete).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("flags missing URLs for non-anonymous sources", () => {
      const result = assessSourceCompleteness({
        ...baseArticle,
        sources: [
          {
            sourceType: "PRIMARY_DOCUMENT",
            quality: "PRIMARY",
            url: "https://example.com/doc",
          },
          {
            sourceType: "SECONDARY_REPORT",
            quality: "SECONDARY",
            url: null, // missing URL
          },
        ],
      });
      expect(result.issues).toContain(
        "Some non-anonymous sources missing URLs"
      );
      expect(result.complete).toBe(true); // Still complete enough (>= 50)
    });

    it("marks as complete at score >= 50", () => {
      const result = assessSourceCompleteness({
        ...baseArticle,
        sources: [
          {
            sourceType: "PRIMARY_DOCUMENT",
            quality: "PRIMARY",
            url: "https://example.com/doc",
          },
        ],
      });
      // 20 + 30 + 20 + 0 (single) = 70
      expect(result.score).toBe(70);
      expect(result.complete).toBe(true);
    });
  });

  // ============================================================
  // assessContentRisk
  // ============================================================

  describe("assessContentRisk", () => {
    it("returns low risk for benign content with good sources", () => {
      const result = assessContentRisk(
        "New Park Opens Downtown",
        "The city unveiled a new park today with a ribbon-cutting ceremony attended by hundreds of residents.",
        80
      );
      expect(result.riskLevel).toBe("low");
      expect(result.shouldHold).toBe(false);
      expect(result.triggers).toHaveLength(0);
    });

    it("returns medium risk for allegation language with good sources", () => {
      const result = assessContentRisk(
        "Mayor Accused of Misconduct",
        "The mayor has been accused of misconduct by several former employees.",
        80
      );
      expect(result.riskLevel).toBe("medium");
      expect(result.shouldHold).toBe(false);
      expect(result.triggers).toContain("Contains allegation language");
    });

    it("returns high risk for allegation with weak sourcing", () => {
      const result = assessContentRisk(
        "Senator Alleged Fraud",
        "The senator is alleged to have committed fraud in connection with campaign finances.",
        30
      );
      expect(result.riskLevel).toBe("high");
      expect(result.shouldHold).toBe(true);
      expect(result.triggers).toContain("Allegation with insufficient sourcing");
    });

    it("returns medium risk for very weak sourcing alone", () => {
      const result = assessContentRisk(
        "Tech Company Launches Product",
        "A new product was launched today by a technology company.",
        10
      );
      expect(result.riskLevel).toBe("medium");
      expect(result.shouldHold).toBe(false);
      expect(result.triggers).toContain("Very weak sourcing");
    });

    it("detects various allegation patterns", () => {
      const patterns = [
        { title: "Investigation into Company", text: "investigation of the firm" },
        { title: "Corruption Scandal", text: "corruption in government" },
        { title: "Criminal Charges", text: "charged with criminal acts" },
        { title: "Sexual Harassment Case", text: "sexual harassment allegations" },
        { title: "Cover-up", text: "evidence of a cover-up" },
      ];

      for (const p of patterns) {
        const result = assessContentRisk(p.title, p.text, 80);
        expect(result.riskLevel).not.toBe("low");
        expect(result.triggers.length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================
  // getReputationScore
  // ============================================================

  describe("getReputationScore", () => {
    it("returns cached score if available", async () => {
      vi.mocked(cacheGet).mockResolvedValueOnce(75);

      const score = await getReputationScore("user-1");
      expect(score).toBe(75);
      expect(mockPrismaClient.journalistProfile.findUnique).not.toHaveBeenCalled();
    });

    it("falls back to database when cache is empty", async () => {
      vi.mocked(cacheGet).mockResolvedValueOnce(null);
      mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
        reputationScore: 65,
      });

      const score = await getReputationScore("user-1");
      expect(score).toBe(65);
      expect(cacheSet).toHaveBeenCalledWith("reputation:user-1", 65, 300);
    });

    it("returns default score (50) when no profile exists", async () => {
      vi.mocked(cacheGet).mockResolvedValueOnce(null);
      mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce(null);

      const score = await getReputationScore("user-new");
      expect(score).toBe(50);
    });
  });

  // ============================================================
  // recordReputationEvent
  // ============================================================

  describe("recordReputationEvent", () => {
    it("records event and updates profile score", async () => {
      mockPrismaClient.reputationEvent.create.mockResolvedValueOnce({});
      mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
        id: "profile-1",
        userId: "user-1",
        reputationScore: 50,
      });
      mockPrismaClient.journalistProfile.update.mockResolvedValueOnce({});

      const newScore = await recordReputationEvent(
        "user-1",
        "ARTICLE_PUBLISHED" as any
      );

      expect(newScore).toBe(52); // 50 + 2.0
      expect(mockPrismaClient.reputationEvent.create).toHaveBeenCalled();
      expect(mockPrismaClient.journalistProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1" },
          data: { reputationScore: 52 },
        })
      );
      expect(cacheDel).toHaveBeenCalledWith("reputation:user-1");
      expect(auditLog).toHaveBeenCalled();
    });

    it("clamps score to max 100", async () => {
      mockPrismaClient.reputationEvent.create.mockResolvedValueOnce({});
      mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
        id: "profile-1",
        userId: "user-1",
        reputationScore: 99,
      });
      mockPrismaClient.journalistProfile.update.mockResolvedValueOnce({});

      const newScore = await recordReputationEvent(
        "user-1",
        "ARTICLE_PUBLISHED" as any
      );

      expect(newScore).toBe(100); // 99 + 2 clamped to 100
    });

    it("clamps score to min 0", async () => {
      mockPrismaClient.reputationEvent.create.mockResolvedValueOnce({});
      mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
        id: "profile-1",
        userId: "user-1",
        reputationScore: 2,
      });
      mockPrismaClient.journalistProfile.update.mockResolvedValueOnce({});

      const newScore = await recordReputationEvent(
        "user-1",
        "DISPUTE_UPHELD_AGAINST" as any
      );

      expect(newScore).toBe(0); // 2 - 5 clamped to 0
    });

    it("allows custom delta override", async () => {
      mockPrismaClient.reputationEvent.create.mockResolvedValueOnce({});
      mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
        id: "profile-1",
        userId: "user-1",
        reputationScore: 50,
      });
      mockPrismaClient.journalistProfile.update.mockResolvedValueOnce({});

      const newScore = await recordReputationEvent(
        "user-1",
        "MANUAL_ADJUSTMENT" as any,
        { delta: 10, reason: "Admin adjustment" }
      );

      expect(newScore).toBe(60); // 50 + 10
    });

    it("returns default when no profile exists", async () => {
      mockPrismaClient.reputationEvent.create.mockResolvedValueOnce({});
      mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce(null);

      const newScore = await recordReputationEvent(
        "user-1",
        "ARTICLE_PUBLISHED" as any
      );

      expect(newScore).toBe(50); // default
    });
  });

  // ============================================================
  // applyLabel / removeLabel / getActiveLabels
  // ============================================================

  describe("Label Management", () => {
    it("applies a label and logs audit event", async () => {
      mockPrismaClient.integrityLabel.create.mockResolvedValueOnce({
        id: "label-1",
      });

      await applyLabel(
        "article-1",
        "DISPUTED",
        "admin-1",
        "Factual inaccuracy"
      );

      expect(mockPrismaClient.integrityLabel.create).toHaveBeenCalledWith({
        data: {
          articleId: "article-1",
          labelType: "DISPUTED",
          appliedBy: "admin-1",
          reason: "Factual inaccuracy",
        },
      });
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "label_applied",
          entity: "Article",
          entityId: "article-1",
        })
      );
    });

    it("removes a label by setting active to false", async () => {
      mockPrismaClient.integrityLabel.update.mockResolvedValueOnce({});

      await removeLabel("label-1", "admin-1");

      expect(mockPrismaClient.integrityLabel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "label-1" },
          data: expect.objectContaining({ active: false }),
        })
      );
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "label_removed",
        })
      );
    });

    it("fetches active labels for an article", async () => {
      const mockLabels = [
        { id: "l1", labelType: "DISPUTED", active: true },
      ];
      mockPrismaClient.integrityLabel.findMany.mockResolvedValueOnce(mockLabels);

      const labels = await getActiveLabels("article-1");

      expect(labels).toEqual(mockLabels);
      expect(mockPrismaClient.integrityLabel.findMany).toHaveBeenCalledWith({
        where: { articleId: "article-1", active: true },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  // ============================================================
  // processCorrectionReputation
  // ============================================================

  describe("processCorrectionReputation", () => {
    it("uses minor event type for TYPO severity", async () => {
      mockPrismaClient.reputationEvent.create.mockResolvedValueOnce({});
      mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
        id: "profile-1",
        userId: "user-1",
        reputationScore: 50,
      });
      mockPrismaClient.journalistProfile.update.mockResolvedValueOnce({});
      mockPrismaClient.integrityLabel.create.mockResolvedValueOnce({});

      await processCorrectionReputation(
        "user-1",
        "TYPO" as any,
        "article-1"
      );

      // Should record CORRECTION_ISSUED_MINOR (delta = -0.5)
      expect(mockPrismaClient.reputationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "CORRECTION_ISSUED_MINOR",
            delta: -0.5,
          }),
        })
      );
    });

    it("uses major event type for FACTUAL_ERROR severity", async () => {
      mockPrismaClient.reputationEvent.create.mockResolvedValueOnce({});
      mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
        id: "profile-1",
        userId: "user-1",
        reputationScore: 50,
      });
      mockPrismaClient.journalistProfile.update.mockResolvedValueOnce({});
      mockPrismaClient.integrityLabel.create.mockResolvedValueOnce({});

      await processCorrectionReputation(
        "user-1",
        "FACTUAL_ERROR" as any,
        "article-1"
      );

      // Should record CORRECTION_ISSUED_MAJOR (delta = -3.0)
      expect(mockPrismaClient.reputationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "CORRECTION_ISSUED_MAJOR",
            delta: -3.0,
          }),
        })
      );
    });
  });
});
