import { MeiliSearch, Index } from "meilisearch";

const globalForMeili = globalThis as unknown as {
  meili: MeiliSearch | undefined;
};

function createMeiliClient(): MeiliSearch | null {
  const host = process.env.MEILISEARCH_HOST;
  if (!host) {
    console.warn("MEILISEARCH_HOST not set - search features disabled");
    return null;
  }
  return new MeiliSearch({
    host,
    apiKey: process.env.MEILISEARCH_API_KEY || "",
  });
}

export const meili = globalForMeili.meili ?? createMeiliClient();

if (process.env.NODE_ENV !== "production" && meili) {
  globalForMeili.meili = meili;
}

// ============================================================
// Index names
// ============================================================

const ARTICLES_INDEX = "articles";
const AUTHORS_INDEX = "authors";

// ============================================================
// Index initialization
// ============================================================

export async function initializeSearchIndexes(): Promise<void> {
  if (!meili) return;

  // Articles index
  try {
    await meili.createIndex(ARTICLES_INDEX, { primaryKey: "id" });
  } catch {
    // Index may already exist
  }

  const articlesIndex = meili.index(ARTICLES_INDEX);
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
  });

  // Authors index
  try {
    await meili.createIndex(AUTHORS_INDEX, { primaryKey: "id" });
  } catch {
    // Index may already exist
  }

  const authorsIndex = meili.index(AUTHORS_INDEX);
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
  if (!meili) return;
  const index = meili.index(ARTICLES_INDEX);
  await index.addDocuments([article]);
}

export async function removeArticleFromIndex(id: string): Promise<void> {
  if (!meili) return;
  const index = meili.index(ARTICLES_INDEX);
  await index.deleteDocument(id);
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
  if (!meili) return { hits: [], totalHits: 0 };

  const index = meili.index(ARTICLES_INDEX);
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
  if (!meili) return;
  const index = meili.index(AUTHORS_INDEX);
  await index.addDocuments([author]);
}

export async function searchAuthors(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{ hits: SearchableAuthor[]; totalHits: number }> {
  if (!meili) return { hits: [], totalHits: 0 };

  const index = meili.index(AUTHORS_INDEX);
  const results = await index.search<SearchableAuthor>(query, {
    limit: options?.limit || 20,
    offset: options?.offset || 0,
  });

  return {
    hits: results.hits,
    totalHits: results.estimatedTotalHits || 0,
  };
}
