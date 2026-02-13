"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArticleCard } from "@/components/article/article-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Loader2 } from "lucide-react";

interface SearchResult {
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

interface AuthorResult {
  id: string;
  pseudonym: string;
  bio: string | null;
  beats: string[];
  verificationStatus: string;
  reputationScore: number;
  articleCount: number;
}

const DEBOUNCE_MS = 300;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<SearchResult[]>([]);
  const [authors, setAuthors] = useState<AuthorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Track the latest request so stale responses are discarded
  const latestRequestRef = useRef(0);

  const executeSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setArticles([]);
      setAuthors([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    const requestId = ++latestRequestRef.current;
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}&type=all`
      );
      // Discard if a newer request has been fired
      if (requestId !== latestRequestRef.current) return;

      if (res.ok) {
        const data = await res.json();
        setArticles(data.data.articles || []);
        setAuthors(data.data.authors || []);
      }
    } catch (error) {
      if (requestId !== latestRequestRef.current) return;
      console.error("Search failed:", error);
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced auto-search on keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search</h1>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <Input
          placeholder="Search articles and authors..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
          autoFocus
        />
      </div>

      {loading && !searched ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : searched ? (
        <Tabs defaultValue="articles">
          <TabsList>
            <TabsTrigger value="articles">
              Articles ({articles.length})
            </TabsTrigger>
            <TabsTrigger value="authors">
              Authors ({authors.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-4">
            {articles.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                No articles found for &ldquo;{query}&rdquo;
              </p>
            ) : (
              <div className="space-y-4">
                {articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={{
                      id: article.id,
                      title: article.title,
                      slug: article.id,
                      summary: article.summary,
                      publishedAt: article.publishedAt,
                      author: {
                        pseudonym: article.authorName,
                        reputationScore: article.reputationScore,
                        verified: true,
                      },
                      integrityLabels: article.integrityLabels,
                      correctionCount: 0,
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="authors" className="mt-4">
            {authors.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                No authors found for &ldquo;{query}&rdquo;
              </p>
            ) : (
              <div className="space-y-3">
                {authors.map((author) => (
                  <a
                    key={author.id}
                    href={`/author/${author.pseudonym}`}
                    className="block border rounded-lg p-4 hover:border-foreground/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{author.pseudonym}</h3>
                        {author.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {author.bio}
                          </p>
                        )}
                        {author.beats.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {author.beats.map((beat) => (
                              <span
                                key={beat}
                                className="text-xs bg-muted px-2 py-0.5 rounded"
                              >
                                {beat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p>{author.articleCount} articles</p>
                        <p className="text-muted-foreground">
                          Score: {author.reputationScore.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Enter a search query to find articles and authors.
        </div>
      )}
    </div>
  );
}
