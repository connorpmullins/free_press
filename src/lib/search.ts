import { MeiliSearch } from "meilisearch";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Meilisearch client – lazy, self-healing singleton
// ---------------------------------------------------------------------------
// Previous implementation cached the client on globalThis at module-load time.
// During Turbopack HMR or .env reloads, the env vars can be temporarily
// unavailable, which creates a client with an empty API key.  That broken
// client then gets stuck in the cache, causing *every* search to 403 until
// the dev server is fully restarted.
//
// This version:
//   1. Creates the client lazily on first use (getMeili()).
//   2. Validates the API key is non-empty before caching.
//   3. Exposes resetMeiliClient() so callers can force a fresh client if
//      Meilisearch returns an auth error (403).
// ---------------------------------------------------------------------------

const globalForMeili = globalThis as unknown as {
  meili: MeiliSearch | undefined;
};

function createMeiliClient(): MeiliSearch | null {
  const host = process.env.MEILISEARCH_HOST;
  const apiKey = process.env.MEILISEARCH_API_KEY;

  if (!host) {
    console.warn("MEILISEARCH_HOST not set – search features disabled");
    return null;
  }

  if (!apiKey) {
    console.warn(
      "MEILISEARCH_API_KEY not set – skipping client creation (will retry on next request)"
    );
    return null;
  }

  return new MeiliSearch({ host, apiKey });
}

/**
 * Return the cached MeiliSearch client, creating one if necessary.
 * Returns `null` when host/key env vars are missing.
 */
export function getMeili(): MeiliSearch | null {
  if (globalForMeili.meili) return globalForMeili.meili;

  const client = createMeiliClient();
  if (client && process.env.NODE_ENV !== "production") {
    globalForMeili.meili = client;
  }
  return client;
}

/**
 * Drop the cached client so the next `getMeili()` call rebuilds it from
 * current env vars.  Call this when Meilisearch returns a 403 / auth error.
 */
export function resetMeiliClient(): void {
  globalForMeili.meili = undefined;
}

// Keep a convenience export for code that only reads the value at init time
// (e.g. initializeSearchIndexes).  It will be `null` when env vars are absent
// at import time, but getMeili() is preferred for runtime calls.
export const meili = getMeili();

// ============================================================
// Index names
// ============================================================

const ARTICLES_INDEX = "articles";
const AUTHORS_INDEX = "authors";

// ============================================================
// Index initialization
// ============================================================

export async function initializeSearchIndexes(): Promise<void> {
  const client = getMeili();
  if (!client) return;

  // Articles index
  try {
    await client.createIndex(ARTICLES_INDEX, { primaryKey: "id" });
  } catch {
    // Index may already exist
  }

  const articlesIndex = client.index(ARTICLES_INDEX);
  await articlesIndex.updateSettings({
    searchableAttributes: ["title", "summary", "contentText", "authorName"],
    filterableAttributes: [
      "status",
      "authorId",
      "publishedAt",
      "integrityLabels",
    ],
    sortableAttributes: ["publishedAt", "reputationScore"],
    rankingRules: [
      "words",
      "typo",
      "proximity",
      "attribute",
      "sort",
      "exactness",
    ],
    // Treat currency symbols as word separators so "$47" is tokenized as "47"
    // and users can find articles by bare numbers (e.g. searching "47" matches
    // "$47 Million …").
    separatorTokens: ["$", "€", "£", "¥"],
  });

  // Authors index
  try {
    await client.createIndex(AUTHORS_INDEX, { primaryKey: "id" });
  } catch {
    // Index may already exist
  }

  const authorsIndex = client.index(AUTHORS_INDEX);
  await authorsIndex.updateSettings({
    searchableAttributes: ["pseudonym", "bio", "beats"],
    filterableAttributes: ["verificationStatus", "reputationScore"],
    sortableAttributes: ["reputationScore", "articleCount"],
  });
}

// ============================================================
// Article search operations
// ============================================================

export interface SearchableArticle {
  id: string;
  title: string;
  summary: string | null;
  contentText: string;
  authorId: string;
  authorName: string;
  status: string;
  publishedAt: string | null;
  integrityLabels: string[];
  reputationScore: number;
}

export async function indexArticle(article: SearchableArticle): Promise<void> {
  const client = getMeili();
  if (!client) return;
  const index = client.index(ARTICLES_INDEX);
  await index.addDocuments([article]);
}

export async function removeArticleFromIndex(id: string): Promise<void> {
  const client = getMeili();
  if (!client) return;
  const index = client.index(ARTICLES_INDEX);
  await index.deleteDocument(id);
}

export async function syncArticleInSearch(articleId: string): Promise<void> {
  const article = await db.article.findUnique({
    where: { id: articleId },
    include: {
      author: {
        include: {
          journalistProfile: {
            select: { pseudonym: true, reputationScore: true },
          },
        },
      },
      integrityLabels: {
        where: { active: true },
        select: { labelType: true },
      },
    },
  });

  if (!article) {
    await removeArticleFromIndex(articleId);
    return;
  }

  if (article.status !== "PUBLISHED") {
    await removeArticleFromIndex(article.id);
    return;
  }

  await indexArticle({
    id: article.id,
    title: article.title,
    summary: article.summary,
    contentText: article.contentText,
    authorId: article.authorId,
    authorName: article.author.journalistProfile?.pseudonym ?? "Unknown",
    status: article.status,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    integrityLabels: article.integrityLabels.map((l) => l.labelType),
    reputationScore: article.author.journalistProfile?.reputationScore ?? 50,
  });
}

export async function searchArticles(
  query: string,
  options?: {
    filter?: string;
    sort?: string[];
    limit?: number;
    offset?: number;
  }
): Promise<{ hits: SearchableArticle[]; totalHits: number }> {
  const client = getMeili();
  if (!client) return { hits: [], totalHits: 0 };

  try {
    const index = client.index(ARTICLES_INDEX);
    const results = await index.search<SearchableArticle>(query, {
      filter: options?.filter,
      sort: options?.sort,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    });

    return {
      hits: results.hits,
      totalHits: results.estimatedTotalHits || 0,
    };
  } catch (error: unknown) {
    // Auto-recover from stale API key (403) by resetting the cached client.
    // The next search call will create a fresh client from current env vars.
    if (isMeiliAuthError(error)) {
      console.warn("Meilisearch auth error – resetting cached client");
      resetMeiliClient();
    }
    throw error;
  }
}

// ============================================================
// Author search operations
// ============================================================

export interface SearchableAuthor {
  id: string;
  pseudonym: string;
  bio: string | null;
  beats: string[];
  verificationStatus: string;
  reputationScore: number;
  articleCount: number;
}

export async function indexAuthor(author: SearchableAuthor): Promise<void> {
  const client = getMeili();
  if (!client) return;
  const index = client.index(AUTHORS_INDEX);
  await index.addDocuments([author]);
}

export async function searchAuthors(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{ hits: SearchableAuthor[]; totalHits: number }> {
  const client = getMeili();
  if (!client) return { hits: [], totalHits: 0 };

  try {
    const index = client.index(AUTHORS_INDEX);
    const results = await index.search<SearchableAuthor>(query, {
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    });

    return {
      hits: results.hits,
      totalHits: results.estimatedTotalHits || 0,
    };
  } catch (error: unknown) {
    if (isMeiliAuthError(error)) {
      console.warn("Meilisearch auth error – resetting cached client");
      resetMeiliClient();
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Detect Meilisearch 403 / auth errors so we can reset the cached client. */
function isMeiliAuthError(error: unknown): boolean {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 403
  ) {
    return true;
  }
  // MeiliSearch SDK sets httpStatus on its error objects
  if (
    error &&
    typeof error === "object" &&
    "httpStatus" in error &&
    (error as { httpStatus?: number }).httpStatus === 403
  ) {
    return true;
  }
  return false;
}
