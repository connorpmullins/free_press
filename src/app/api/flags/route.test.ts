import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { mockPrismaClient } from "@/test/setup";
import { checkRateLimit } from "@/lib/redis";

// Mock requireAuth to return a test user
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    requireAuth: vi.fn().mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      role: "READER",
    }),
  };
});

describe("POST /api/flags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetAt: Math.floor(Date.now() / 1000) + 3600,
    });
  });

  it("creates a flag for a published article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      status: "PUBLISHED",
    });
    mockPrismaClient.flag.findFirst.mockResolvedValueOnce(null); // No existing flag
    mockPrismaClient.flag.create.mockResolvedValueOnce({ id: "flag-1" });

    const request = new NextRequest("http://localhost/api/flags", {
      method: "POST",
      body: JSON.stringify({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "INACCURATE",
        details: "The numbers in the article are incorrect.",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.flag.id).toBe("flag-1");
  });

  it("rejects flag for non-published article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      status: "DRAFT",
    });

    const request = new NextRequest("http://localhost/api/flags", {
      method: "POST",
      body: JSON.stringify({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "INACCURATE",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it("rejects duplicate pending flag", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      status: "PUBLISHED",
    });
    mockPrismaClient.flag.findFirst.mockResolvedValueOnce({
      id: "existing-flag",
    }); // Already flagged

    const request = new NextRequest("http://localhost/api/flags", {
      method: "POST",
      body: JSON.stringify({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "MISLEADING",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("already have a pending flag");
  });

  it("rejects when rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Math.floor(Date.now() / 1000) + 3600,
    });

    const request = new NextRequest("http://localhost/api/flags", {
      method: "POST",
      body: JSON.stringify({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "INACCURATE",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.success).toBe(false);
  });

  it("rejects invalid reason", async () => {
    const request = new NextRequest("http://localhost/api/flags", {
      method: "POST",
      body: JSON.stringify({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "NOT_A_VALID_REASON",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
