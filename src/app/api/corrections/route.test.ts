import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { mockPrismaClient } from "@/test/setup";

// Mock requireAuth to return a journalist user
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    requireAuth: vi.fn().mockResolvedValue({
      id: "journalist-1",
      email: "journalist@example.com",
      role: "JOURNALIST",
    }),
  };
});

// Mock integrity service
vi.mock("@/services/integrity", () => ({
  processCorrectionReputation: vi.fn().mockResolvedValue(undefined),
  assessSourceCompleteness: vi.fn(),
  assessContentRisk: vi.fn(),
  recordReputationEvent: vi.fn(),
  applyLabel: vi.fn(),
}));

describe("POST /api/corrections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a correction for author's own published article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      authorId: "journalist-1",
      status: "PUBLISHED",
    });
    mockPrismaClient.correction.create.mockResolvedValueOnce({
      id: "correction-1",
    });

    const request = new NextRequest("http://localhost/api/corrections", {
      method: "POST",
      body: JSON.stringify({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        content: "Corrected the date from 2024 to 2025 in paragraph 3.",
        severity: "FACTUAL_ERROR",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.correction.id).toBe("correction-1");
  });

  it("rejects correction from non-author", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      authorId: "other-journalist",
      status: "PUBLISHED",
    });

    const request = new NextRequest("http://localhost/api/corrections", {
      method: "POST",
      body: JSON.stringify({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        content: "Attempting to correct someone else's article.",
        severity: "TYPO",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });

  it("rejects correction for non-published article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      authorId: "journalist-1",
      status: "DRAFT",
    });

    const request = new NextRequest("http://localhost/api/corrections", {
      method: "POST",
      body: JSON.stringify({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        content: "This is a correction for a draft article.",
        severity: "TYPO",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("published articles");
  });

  it("rejects correction with invalid severity", async () => {
    const request = new NextRequest("http://localhost/api/corrections", {
      method: "POST",
      body: JSON.stringify({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        content: "This is a correction.",
        severity: "INVALID",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
