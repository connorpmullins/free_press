"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/components/providers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FileText,
  Flag,
  AlertTriangle,
  CreditCard,
  Shield,
  BarChart3,
} from "lucide-react";

interface Stats {
  users: {
    total: number;
    journalists: number;
    verifiedJournalists: number;
  };
  content: {
    totalArticles: number;
    published: number;
    held: number;
    sourcingRate: number;
  };
  moderation: {
    pendingFlags: number;
    openDisputes: number;
  };
  revenue: {
    activeSubscriptions: number;
  };
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user?.role === "ADMIN") {
      fetchStats();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {loading || !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">{stats.users.total}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verified Journalists
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">
                  {stats.users.verifiedJournalists}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {stats.users.journalists} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Published Articles
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">
                  {stats.content.published}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.content.sourcingRate}% complete sourcing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Active Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">
                  {stats.revenue.activeSubscriptions}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action items */}
          <h2 className="text-lg font-semibold mb-4">Action Items</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Link href="/admin/flags">
              <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                    <Flag className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Pending Flags</p>
                    <p className="text-2xl font-bold">
                      {stats.moderation.pendingFlags}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/disputes">
              <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Open Disputes</p>
                    <p className="text-2xl font-bold">
                      {stats.moderation.openDisputes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Held Articles</p>
                  <p className="text-2xl font-bold">{stats.content.held}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
