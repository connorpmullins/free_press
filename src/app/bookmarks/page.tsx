"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/components/providers";
import { ArticleCard } from "@/components/article/article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark } from "lucide-react";

interface BookmarkEntry {
  id: string;
  createdAt: string;
  article: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    publishedAt: string | null;
    authorPseudonym: string;
  };
}

export default function BookmarksPage() {
  const { user, loading: authLoading } = useUser();
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchBookmarks() {
      try {
        const res = await fetch("/api/bookmarks");
        if (res.ok) {
          const data = await res.json();
          setBookmarks(data.data.bookmarks);
        }
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBookmarks();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign in required</h1>
        <p className="text-muted-foreground">
          Sign in to view your bookmarks.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Bookmark className="h-6 w-6" />
        Bookmarks
      </h1>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20">
          <Bookmark className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">
            No bookmarks yet. Save articles to read later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => (
            <ArticleCard
              key={bookmark.id}
              article={{
                id: bookmark.article.id,
                title: bookmark.article.title,
                slug: bookmark.article.slug,
                summary: bookmark.article.summary,
                publishedAt: bookmark.article.publishedAt,
                author: {
                  pseudonym: bookmark.article.authorPseudonym,
                  reputationScore: 50,
                  verified: true,
                },
                integrityLabels: [],
                correctionCount: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
