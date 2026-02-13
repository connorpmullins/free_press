import { describe, it, expect } from "vitest";
import {
  loginSchema,
  createArticleSchema,
  updateArticleSchema,
  createFlagSchema,
  createCorrectionSchema,
  createDisputeSchema,
  createAppealSchema,
  updateProfileSchema,
  createFeatureRequestSchema,
  reviewFlagSchema,
  resolveDisputeSchema,
  accountActionSchema,
} from "./validations";

describe("Validation Schemas", () => {
  // ============================================================
  // loginSchema
  // ============================================================

  describe("loginSchema", () => {
    it("accepts valid email", () => {
      const result = loginSchema.safeParse({ email: "user@example.com" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({ email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("rejects empty email", () => {
      const result = loginSchema.safeParse({ email: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing email", () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // createArticleSchema
  // ============================================================

  describe("createArticleSchema", () => {
    const validArticle = {
      title: "A Valid Article Title",
      content: { type: "doc", content: [] },
      contentText: "A".repeat(100),
      sources: [
        {
          sourceType: "PRIMARY_DOCUMENT",
          quality: "PRIMARY",
          url: "https://example.com",
          title: "Primary Source",
        },
      ],
    };

    it("accepts valid article data", () => {
      const result = createArticleSchema.safeParse(validArticle);
      expect(result.success).toBe(true);
    });

    it("rejects title shorter than 5 characters", () => {
      const result = createArticleSchema.safeParse({
        ...validArticle,
        title: "Hi",
      });
      expect(result.success).toBe(false);
    });

    it("rejects title longer than 200 characters", () => {
      const result = createArticleSchema.safeParse({
        ...validArticle,
        title: "A".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("rejects contentText shorter than 100 characters", () => {
      const result = createArticleSchema.safeParse({
        ...validArticle,
        contentText: "Short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects article with no sources", () => {
      const result = createArticleSchema.safeParse({
        ...validArticle,
        sources: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid source type", () => {
      const result = createArticleSchema.safeParse({
        ...validArticle,
        sources: [
          {
            sourceType: "INVALID_TYPE",
            quality: "PRIMARY",
            url: "https://example.com",
            title: "Source",
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("allows empty string for URL", () => {
      const result = createArticleSchema.safeParse({
        ...validArticle,
        sources: [
          {
            sourceType: "INTERVIEW",
            quality: "ANONYMOUS",
            url: "",
            title: "Anonymous Source",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("allows optional summary", () => {
      const result = createArticleSchema.safeParse({
        ...validArticle,
        summary: "A summary of the article",
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================
  // updateArticleSchema
  // ============================================================

  describe("updateArticleSchema", () => {
    it("accepts partial updates", () => {
      const result = updateArticleSchema.safeParse({
        title: "Updated Title Here",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      const result = updateArticleSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects title shorter than 5 characters", () => {
      const result = updateArticleSchema.safeParse({ title: "Hi" });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // createFlagSchema
  // ============================================================

  describe("createFlagSchema", () => {
    it("accepts valid flag", () => {
      const result = createFlagSchema.safeParse({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "INACCURATE",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid reason", () => {
      const result = createFlagSchema.safeParse({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "NOT_A_REASON",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-UUID articleId", () => {
      const result = createFlagSchema.safeParse({
        articleId: "not-a-uuid",
        reason: "INACCURATE",
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // createCorrectionSchema
  // ============================================================

  describe("createCorrectionSchema", () => {
    it("accepts valid correction", () => {
      const result = createCorrectionSchema.safeParse({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        content: "This is a correction that fixes a factual error in the article.",
        severity: "FACTUAL_ERROR",
      });
      expect(result.success).toBe(true);
    });

    it("rejects correction shorter than 10 characters", () => {
      const result = createCorrectionSchema.safeParse({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        content: "Short",
        severity: "TYPO",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid severity", () => {
      const result = createCorrectionSchema.safeParse({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        content: "This is a correction",
        severity: "INVALID_SEVERITY",
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // createDisputeSchema
  // ============================================================

  describe("createDisputeSchema", () => {
    it("accepts valid dispute", () => {
      const result = createDisputeSchema.safeParse({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "This article contains verifiably false claims about...",
      });
      expect(result.success).toBe(true);
    });

    it("rejects reason shorter than 20 characters", () => {
      const result = createDisputeSchema.safeParse({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "Too short",
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // createAppealSchema
  // ============================================================

  describe("createAppealSchema", () => {
    it("accepts valid appeal", () => {
      const result = createAppealSchema.safeParse({
        disputeId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "The dispute was resolved incorrectly because...",
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================
  // updateProfileSchema
  // ============================================================

  describe("updateProfileSchema", () => {
    it("accepts valid profile update", () => {
      const result = updateProfileSchema.safeParse({
        displayName: "John Doe",
        pseudonym: "johndoe",
        bio: "A journalist covering tech.",
        beats: ["Technology", "Science"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects pseudonym with special characters", () => {
      const result = updateProfileSchema.safeParse({
        pseudonym: "john doe!",
      });
      expect(result.success).toBe(false);
    });

    it("accepts pseudonym with dashes and underscores", () => {
      const result = updateProfileSchema.safeParse({
        pseudonym: "john-doe_123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects too many beats", () => {
      const result = updateProfileSchema.safeParse({
        beats: Array.from({ length: 11 }, (_, i) => `Beat ${i}`),
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // createFeatureRequestSchema
  // ============================================================

  describe("createFeatureRequestSchema", () => {
    it("accepts valid feature request", () => {
      const result = createFeatureRequestSchema.safeParse({
        title: "Add dark mode support",
        description: "It would be great if we could have a dark mode toggle for better reading at night.",
      });
      expect(result.success).toBe(true);
    });

    it("rejects short title", () => {
      const result = createFeatureRequestSchema.safeParse({
        title: "Hi",
        description: "A sufficiently long description for the feature request.",
      });
      expect(result.success).toBe(false);
    });

    it("rejects short description", () => {
      const result = createFeatureRequestSchema.safeParse({
        title: "A Valid Title",
        description: "Too short",
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // Admin schemas
  // ============================================================

  describe("reviewFlagSchema", () => {
    it("accepts valid flag review", () => {
      const result = reviewFlagSchema.safeParse({
        flagId: "550e8400-e29b-41d4-a716-446655440000",
        status: "UPHELD",
        reviewNote: "Flag is valid.",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = reviewFlagSchema.safeParse({
        flagId: "550e8400-e29b-41d4-a716-446655440000",
        status: "PENDING",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resolveDisputeSchema", () => {
    it("accepts valid dispute resolution", () => {
      const result = resolveDisputeSchema.safeParse({
        disputeId: "550e8400-e29b-41d4-a716-446655440000",
        status: "UPHELD",
        resolution: "The dispute has been upheld.",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("accountActionSchema", () => {
    it("accepts valid account action", () => {
      const result = accountActionSchema.safeParse({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        type: "THROTTLED",
        reason: "Repeatedly violating content policies.",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid action type", () => {
      const result = accountActionSchema.safeParse({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        type: "INVALID_TYPE",
        reason: "Reason here is fine.",
      });
      expect(result.success).toBe(false);
    });
  });
});
