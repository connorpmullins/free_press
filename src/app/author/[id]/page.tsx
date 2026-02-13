"use client";

import { useState, useEffect, use } from "react";
import { ArticleCard } from "@/components/article/article-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, FileText, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";

interface AuthorData {
  id: string;
  pseudonym: string;
  bio: string | null;
  beats: string[];
  avatarUrl: string | null;
  reputationScore: number;
  verificationStatus: string;
  articleCount: number;
}

interface AuthorArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: string | null;
  author: {
    pseudonym: string;
    reputationScore: number;
    verified: boolean;
  };
  sourceCount: number;
  integrityLabels: string[];
  correctionCount: number;
}

export default function AuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [author, setAuthor] = useState<AuthorData | null>(null);
  const [articles, setArticles] = useState<AuthorArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuthor() {
      try {
        // Fetch articles by this author
        const res = await fetch(`/api/articles?authorId=${id}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setArticles(
            data.data.articles.map(
              (a: {
                id: string;
                title: string;
                slug: string;
                summary: string | null;
                publishedAt: string | null;
                author: {
                  pseudonym: string;
                  reputationScore: number;
                  verified: boolean;
                  avatarUrl: string | null;
                };
                sources: unknown[];
                integrityLabels: string[];
                correctionCount: number;
              }) => ({
                ...a,
                sourceCount: a.sources?.length || 0,
              })
            )
          );

          if (data.data.articles.length > 0) {
            const first = data.data.articles[0];
            setAuthor({
              id: first.author.id || id,
              pseudonym: first.author.pseudonym,
              bio: null,
              beats: [],
              avatarUrl: first.author.avatarUrl,
              reputationScore: first.author.reputationScore,
              verificationStatus: first.author.verified
                ? "VERIFIED"
                : "PENDING",
              articleCount: data.data.pagination.total,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch author:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAuthor();
  }, [id]);

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-32 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Author not found</h1>
      </div>
    );
  }

  const initials = author.pseudonym
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      {/* Author header */}
      <div className="flex items-start gap-4 mb-8 pb-8 border-b">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{author.pseudonym}</h1>
            {author.verificationStatus === "VERIFIED" && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>

          {author.bio && (
            <p className="text-muted-foreground mb-2">{author.bio}</p>
          )}

          {author.beats.length > 0 && (
            <div className="flex gap-1.5 mb-2">
              {author.beats.map((beat) => (
                <Badge key={beat} variant="outline" className="text-xs">
                  {beat}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {author.articleCount} articles
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Reputation: {author.reputationScore.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Articles */}
      {articles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No published articles yet.
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
