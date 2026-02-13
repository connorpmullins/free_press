"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PenSquare,
  FileText,
  BarChart3,
  Shield,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  sourceComplete: boolean;
  integrityLabels: string[];
  correctionCount: number;
  flagCount: number;
  bookmarkCount: number;
}

export default function JournalistDashboardPage() {
  const { user, loading: authLoading } = useUser();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchArticles() {
      try {
        const res = await fetch(
          `/api/articles?authorId=${user!.id}&status=ALL&limit=50`
        );
        if (res.ok) {
          const data = await res.json();
          setArticles(data.data.articles);
        }
      } catch (error) {
        console.error("Failed to fetch articles:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [user]);

  if (authLoading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || user.role !== "JOURNALIST") {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">
          This page is only available to journalists.
        </p>
      </div>
    );
  }

  const profile = user.journalistProfile;

  const publishedCount = articles.filter((a) => a.status === "PUBLISHED").length;
  const draftCount = articles.filter((a) => a.status === "DRAFT").length;
  const heldCount = articles.filter((a) => a.status === "HELD").length;
  const flaggedArticles = articles.filter((a) => a.flagCount > 0);

  const statusColors: Record<string, string> = {
    DRAFT: "secondary",
    SUBMITTED: "secondary",
    UNDER_REVIEW: "outline",
    PUBLISHED: "default",
    HELD: "destructive",
    REMOVED: "destructive",
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.pseudonym || user.displayName}
          </p>
        </div>
        <Link href="/journalist/write">
          <Button>
            <PenSquare className="h-4 w-4 mr-2" />
            Write Article
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Published
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{publishedCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Reputation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">
              {profile?.reputationScore?.toFixed(1) || "50.0"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Badge
              variant={
                profile?.verificationStatus === "VERIFIED"
                  ? "default"
                  : "secondary"
              }
            >
              {profile?.verificationStatus || "NONE"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">
              ${profile?.totalEarnings?.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {heldCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {heldCount} article{heldCount > 1 ? "s" : ""} held for review
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              These articles require additional review before publishing.
            </p>
          </div>
        </div>
      )}

      {profile?.verificationStatus !== "VERIFIED" && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">
              Complete identity verification
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Verify your identity to start publishing and earning revenue.
            </p>
            <Link href="/settings">
              <Button size="sm" variant="outline" className="mt-2">
                Go to Settings
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Articles */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({articles.length})</TabsTrigger>
          <TabsTrigger value="published">
            Published ({publishedCount})
          </TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({draftCount})</TabsTrigger>
          {flaggedArticles.length > 0 && (
            <TabsTrigger value="flagged">
              Flagged ({flaggedArticles.length})
            </TabsTrigger>
          )}
        </TabsList>

        {["all", "published", "drafts", "flagged"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {articles
                  .filter((a) => {
                    if (tab === "published") return a.status === "PUBLISHED";
                    if (tab === "drafts") return a.status === "DRAFT";
                    if (tab === "flagged") return a.flagCount > 0;
                    return true;
                  })
                  .map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <Link
                          href={
                            article.status === "PUBLISHED"
                              ? `/article/${article.slug}`
                              : `/journalist/write?edit=${article.id}`
                          }
                          className="font-medium hover:underline truncate block"
                        >
                          {article.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              (statusColors[article.status] as "default" | "secondary" | "destructive" | "outline") ||
                              "secondary"
                            }
                            className="text-xs"
                          >
                            {article.status}
                          </Badge>
                          {article.sourceComplete && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Sources complete
                            </span>
                          )}
                          {article.flagCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <AlertTriangle className="h-3 w-3" />
                              {article.flagCount} flags
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString()
                          : new Date(article.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}

                {articles.filter((a) => {
                  if (tab === "published") return a.status === "PUBLISHED";
                  if (tab === "drafts") return a.status === "DRAFT";
                  if (tab === "flagged") return a.flagCount > 0;
                  return true;
                }).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No articles here yet.
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
