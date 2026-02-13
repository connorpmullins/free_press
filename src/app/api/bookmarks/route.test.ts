import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { mockPrismaClient } from "@/test/setup";

// Mock requireAuth
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

describe("Bookmarks API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/bookmarks", () => {
    it("returns user's bookmarks", async () => {
      mockPrismaClient.bookmark.findMany.mockResolvedValueOnce([
        {
          id: "bm-1",
          createdAt: new Date("2025-01-15"),
          article: {
            id: "article-1",
            title: "Test Article",
            slug: "test-article",
            summary: "Summary",
            publishedAt: new Date("2025-01-10"),
            author: {
              journalistProfile: {
                pseudonym: "TestJournalist",
                avatarUrl: null,
              },
            },
          },
        },
      ]);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.bookmarks).toHaveLength(1);
      expect(body.data.bookmarks[0].article.title).toBe("Test Article");
    });
  });

  describe("POST /api/bookmarks", () => {
    it("creates a new bookmark", async () => {
      mockPrismaClient.bookmark.findUnique.mockResolvedValueOnce(null);
      mockPrismaClient.bookmark.create.mockResolvedValueOnce({});

      const request = new NextRequest("http://localhost/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ articleId: "article-1" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.bookmarked).toBe(true);
    });

    it("removes existing bookmark (toggle off)", async () => {
      mockPrismaClient.bookmark.findUnique.mockResolvedValueOnce({
        id: "bm-1",
        userId: "user-1",
        articleId: "article-1",
      });
      mockPrismaClient.bookmark.delete.mockResolvedValueOnce({});

      const request = new NextRequest("http://localhost/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ articleId: "article-1" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.bookmarked).toBe(false);
    });

    it("rejects request without articleId", async () => {
      const request = new NextRequest("http://localhost/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("articleId is required");
    });
  });
});
