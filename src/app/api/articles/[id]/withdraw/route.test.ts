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

describe("POST /api/articles/[id]/withdraw", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("withdraws own published article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      authorId: "journalist-1",
      status: "PUBLISHED",
      title: "Published Article",
    });
    mockPrismaClient.article.update.mockResolvedValueOnce({});
    mockPrismaClient.journalistProfile.update.mockResolvedValueOnce({});

    const request = new NextRequest("http://localhost/api/articles/article-1/withdraw", {
      method: "POST",
      body: JSON.stringify({
        reason: "This article contains information that is no longer accurate.",
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "article-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("REMOVED");
    expect(mockPrismaClient.article.update).toHaveBeenCalledWith({
      where: { id: "article-1" },
      data: { status: "REMOVED" },
    });
  });

  it("rejects withdraw of draft article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      authorId: "journalist-1",
      status: "DRAFT",
      title: "Draft Article",
    });

    const request = new NextRequest("http://localhost/api/articles/article-1/withdraw", {
      method: "POST",
      body: JSON.stringify({
        reason: "Trying to withdraw a draft.",
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "article-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("published articles");
  });

  it("rejects withdraw by non-author", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      authorId: "other-journalist",
      status: "PUBLISHED",
      title: "Someone Else's Article",
    });

    const request = new NextRequest("http://localhost/api/articles/article-1/withdraw", {
      method: "POST",
      body: JSON.stringify({
        reason: "Trying to withdraw someone else's article.",
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "article-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });

  it("returns 404 for missing article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/articles/nonexistent/withdraw", {
      method: "POST",
      body: JSON.stringify({
        reason: "Withdrawing a nonexistent article.",
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it("rejects withdraw with too-short reason", async () => {
    const request = new NextRequest("http://localhost/api/articles/article-1/withdraw", {
      method: "POST",
      body: JSON.stringify({
        reason: "Short",
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "article-1" }),
    });

    expect(response.status).toBe(400);
  });
});
