import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, PATCH } from "./route";
import { mockPrismaClient } from "@/test/setup";

// Mock requireAuth to return a journalist user
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getSession: vi.fn().mockResolvedValue({
      user: { id: "journalist-1", email: "journalist@example.com", role: "JOURNALIST" },
    }),
    requireAuth: vi.fn().mockResolvedValue({
      id: "journalist-1",
      email: "journalist@example.com",
      role: "JOURNALIST",
    }),
  };
});

describe("DELETE /api/articles/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes own draft article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      authorId: "journalist-1",
      status: "DRAFT",
      title: "Test Draft",
    });
    mockPrismaClient.article.delete.mockResolvedValueOnce({});

    const request = new NextRequest("http://localhost/api/articles/article-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "article-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);
    expect(mockPrismaClient.article.delete).toHaveBeenCalledWith({
      where: { id: "article-1" },
    });
  });

  it("rejects delete of published article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      authorId: "journalist-1",
      status: "PUBLISHED",
      title: "Published Article",
    });

    const request = new NextRequest("http://localhost/api/articles/article-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "article-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("draft or submitted");
  });

  it("rejects delete by non-author", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      authorId: "other-journalist",
      status: "DRAFT",
      title: "Someone Else's Draft",
    });

    const request = new NextRequest("http://localhost/api/articles/article-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "article-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });

  it("returns 404 for missing article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/articles/nonexistent", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });
});

describe("PATCH /api/articles/[id] - published article editing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows PATCH on published article when changeNote is provided", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      authorId: "journalist-1",
      status: "PUBLISHED",
      version: 1,
      title: "Original Title",
      content: {},
      summary: "Summary",
    });

    // $transaction mock returns the updated article
    mockPrismaClient.$transaction.mockImplementationOnce(async (fn: (tx: typeof mockPrismaClient) => Promise<unknown>) => {
      mockPrismaClient.article.update.mockResolvedValueOnce({
        id: "article-1",
        status: "PUBLISHED",
        version: 2,
      });
      mockPrismaClient.articleVersion.create.mockResolvedValueOnce({});
      return fn(mockPrismaClient);
    });

    const request = new NextRequest("http://localhost/api/articles/article-1", {
      method: "PATCH",
      body: JSON.stringify({
        title: "Updated Title",
        changeNote: "Fixed a typo in the headline",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "article-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("rejects PATCH on published article without changeNote", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      authorId: "journalist-1",
      status: "PUBLISHED",
      version: 1,
      title: "Original Title",
    });

    const request = new NextRequest("http://localhost/api/articles/article-1", {
      method: "PATCH",
      body: JSON.stringify({
        title: "Updated Title",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "article-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("change note is required");
  });
});
