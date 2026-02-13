import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api";
import { searchArticles, searchAuthors } from "@/lib/search";

// GET /api/search - Search articles and authors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "articles"; // "articles" | "authors" | "all"
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!query) {
      return successResponse({ articles: [], authors: [], totalHits: 0 });
    }

    // Helper that retries once on failure (handles stale-client recovery).
    // searchArticles/searchAuthors already call resetMeiliClient() on 403,
    // so the retry will use a freshly-created client.
    async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
      try {
        return await fn();
      } catch {
        // Second attempt after the search lib has reset the cached client
        return await fn();
      }
    }

    const results: Record<string, unknown> = {};

    if (type === "articles" || type === "all") {
      const articleResults = await withRetry(() =>
        searchArticles(query, {
          filter: 'status = "PUBLISHED"',
          limit,
          offset,
        })
      );
      results.articles = articleResults.hits;
      results.articlesTotalHits = articleResults.totalHits;
    }

    if (type === "authors" || type === "all") {
      const authorResults = await withRetry(() =>
        searchAuthors(query, { limit, offset })
      );
      results.authors = authorResults.hits;
      results.authorsTotalHits = authorResults.totalHits;
    }

    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}
