import { z } from "zod";

// ============================================================
// Auth
// ============================================================

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// ============================================================
// Articles
// ============================================================

export const createArticleSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  summary: z
    .string()
    .max(300, "Summary must be less than 300 characters")
    .optional(),
  content: z.any(), // Tiptap JSON content
  contentText: z
    .string()
    .min(100, "Article must be at least 100 characters")
    .max(50_000, "Article must be less than 50,000 characters"),
  sources: z
    .array(
      z.object({
        sourceType: z.enum([
          "PRIMARY_DOCUMENT",
          "OFFICIAL_STATEMENT",
          "INTERVIEW",
          "PUBLIC_RECORD",
          "SECONDARY_REPORT",
          "DATASET",
          "MULTIMEDIA",
          "OTHER",
        ]),
        quality: z.enum(["PRIMARY", "SECONDARY", "ANONYMOUS", "UNVERIFIABLE"]),
        url: z.string().url().optional().or(z.literal("")),
        title: z.string().min(1, "Source title is required"),
        description: z.string().optional(),
        isAnonymous: z.boolean().default(false),
      })
    )
    .min(1, "At least one source is required"),
});

export const updateArticleSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  summary: z
    .string()
    .max(300, "Summary must be less than 300 characters")
    .optional(),
  content: z.any().optional(),
  contentText: z
    .string()
    .max(50_000, "Article must be less than 50,000 characters")
    .optional(),
  changeNote: z.string().optional(),
});

// ============================================================
// Sources
// ============================================================

export const addSourceSchema = z.object({
  sourceType: z.enum([
    "PRIMARY_DOCUMENT",
    "OFFICIAL_STATEMENT",
    "INTERVIEW",
    "PUBLIC_RECORD",
    "SECONDARY_REPORT",
    "DATASET",
    "MULTIMEDIA",
    "OTHER",
  ]),
  quality: z.enum(["PRIMARY", "SECONDARY", "ANONYMOUS", "UNVERIFIABLE"]),
  url: z.string().url().optional().or(z.literal("")),
  title: z.string().min(1, "Source title is required"),
  description: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

// ============================================================
// Flags
// ============================================================

export const createFlagSchema = z.object({
  articleId: z.string().uuid(),
  reason: z.enum([
    "INACCURATE",
    "MISSING_SOURCE",
    "MISLEADING",
    "DEFAMATORY",
    "POLICY_VIOLATION",
    "OTHER",
  ]),
  details: z.string().max(2000).optional(),
});

// ============================================================
// Corrections
// ============================================================

export const createCorrectionSchema = z.object({
  articleId: z.string().uuid(),
  content: z
    .string()
    .min(10, "Correction must be at least 10 characters")
    .max(5000),
  severity: z.enum([
    "TYPO",
    "CLARIFICATION",
    "FACTUAL_ERROR",
    "MATERIAL_ERROR",
    "RETRACTION",
  ]),
});

// ============================================================
// Withdraw
// ============================================================

export const withdrawArticleSchema = z.object({
  reason: z
    .string()
    .min(10, "Withdrawal reason must be at least 10 characters")
    .max(2000),
});

// ============================================================
// Disputes
// ============================================================

export const createDisputeSchema = z.object({
  articleId: z.string().uuid(),
  reason: z
    .string()
    .min(20, "Dispute reason must be at least 20 characters")
    .max(5000),
  evidence: z.string().max(5000).optional(),
});

// ============================================================
// Appeals
// ============================================================

export const createAppealSchema = z.object({
  disputeId: z.string().uuid(),
  reason: z
    .string()
    .min(20, "Appeal reason must be at least 20 characters")
    .max(5000),
  evidence: z.string().max(5000).optional(),
});

// ============================================================
// Profile
// ============================================================

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50)
    .optional(),
  pseudonym: z
    .string()
    .min(3, "Pseudonym must be at least 3 characters")
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Pseudonym can only contain letters, numbers, dashes, and underscores"
    )
    .optional(),
  bio: z.string().max(1000).optional(),
  beats: z.array(z.string().max(50)).max(10).optional(),
});

// ============================================================
// Feature Requests
// ============================================================

export const createFeatureRequestSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000),
});

// ============================================================
// Admin
// ============================================================

export const reviewFlagSchema = z.object({
  flagId: z.string().uuid(),
  status: z.enum(["UPHELD", "DISMISSED"]),
  reviewNote: z.string().max(2000).optional(),
});

export const resolveDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  status: z.enum(["UPHELD", "OVERTURNED", "DISMISSED"]),
  resolution: z.string().max(5000),
});

export const accountActionSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum([
    "THROTTLED",
    "REVENUE_SUSPENDED",
    "COOLDOWN",
    "BANNED",
    "RESTORED",
  ]),
  reason: z.string().min(10).max(2000),
  expiresAt: z.string().datetime().optional(),
});
