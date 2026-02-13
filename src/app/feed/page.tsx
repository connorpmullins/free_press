"use client";

import { useState, useEffect } from "react";
import { ArticleCard } from "@/components/article/article-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FeedArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: string | null;
  authorPseudonym: string;
  authorReputationScore: number;
  authorVerified: boolean;
  sourceCount: number;
  integrityLabels: string[];
  correctionCount: number;
}

export default function FeedPage() {
  const [articles, setArticles] = useState<FeedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"ranked" | "chronological">("ranked");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchFeed() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/feed?sort=${sort}&page=${page}&limit=20`
        );
        if (res.ok) {
          const data = await res.json();
          setArticles(data.data.articles);
          setTotalPages(data.data.pagination.pages);
        }
      } catch (error) {
        console.error("Failed to fetch feed:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeed();
  }, [sort, page]);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feed</h1>
        <Tabs
          value={sort}
          onValueChange={(v) => {
            setSort(v as "ranked" | "chronological");
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="ranked">Ranked</TabsTrigger>
            <TabsTrigger value="chronological">Latest</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {sort === "ranked" && (
        <p className="text-sm text-muted-foreground mb-6">
          Articles ranked by author reputation, source quality, and recency.
          Integrity issues reduce distribution.
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            No articles yet. Check back soon.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={{
                  id: article.id,
                  title: article.title,
                  slug: article.slug,
                  summary: article.summary,
                  publishedAt: article.publishedAt,
                  author: {
                    pseudonym: article.authorPseudonym,
                    reputationScore: article.authorReputationScore,
                    verified: article.authorVerified,
                  },
                  sourceCount: article.sourceCount,
                  integrityLabels: article.integrityLabels,
                  correctionCount: article.correctionCount,
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
