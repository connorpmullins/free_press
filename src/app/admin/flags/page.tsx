"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Flag, CheckCircle, XCircle } from "lucide-react";

interface FlagData {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  article: {
    id: string;
    title: string;
    slug: string;
  };
  reporter: {
    id: string;
    displayName: string | null;
    email: string;
  };
}

export default function AdminFlagsPage() {
  const { user } = useUser();
  const [flags, setFlags] = useState<FlagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;

    async function fetchFlags() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/flags?status=${filter}`);
        if (res.ok) {
          const data = await res.json();
          setFlags(data.data.flags);
        }
      } catch (error) {
        console.error("Failed to fetch flags:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFlags();
  }, [user, filter]);

  async function handleReview(flagId: string, status: "UPHELD" | "DISMISSED") {
    setReviewing(flagId);
    try {
      const res = await fetch("/api/admin/flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flagId,
          status,
          reviewNote: reviewNotes[flagId] || undefined,
        }),
      });

      if (res.ok) {
        toast.success(`Flag ${status.toLowerCase()}`);
        setFlags(flags.filter((f) => f.id !== flagId));
      }
    } catch {
      toast.error("Failed to review flag");
    } finally {
      setReviewing(null);
    }
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flag className="h-6 w-6" />
          Flags
        </h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="UPHELD">Upheld</SelectItem>
            <SelectItem value="DISMISSED">Dismissed</SelectItem>
            <SelectItem value="ALL">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No {filter.toLowerCase()} flags.
        </div>
      ) : (
        <div className="space-y-4">
          {flags.map((flag) => (
            <Card key={flag.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <a
                      href={`/article/${flag.article.slug}`}
                      className="font-medium hover:underline"
                    >
                      {flag.article.title}
                    </a>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {flag.reason}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        by {flag.reporter.displayName || flag.reporter.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(flag.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      flag.status === "PENDING"
                        ? "secondary"
                        : flag.status === "UPHELD"
                        ? "default"
                        : "outline"
                    }
                  >
                    {flag.status}
                  </Badge>
                </div>

                {flag.details && (
                  <p className="text-sm text-muted-foreground border-l-2 pl-3">
                    {flag.details}
                  </p>
                )}

                {flag.status === "PENDING" && (
                  <div className="space-y-2 pt-2 border-t">
                    <Textarea
                      placeholder="Review note (optional)"
                      className="text-sm"
                      rows={2}
                      value={reviewNotes[flag.id] || ""}
                      onChange={(e) =>
                        setReviewNotes({
                          ...reviewNotes,
                          [flag.id]: e.target.value,
                        })
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReview(flag.id, "UPHELD")}
                        disabled={reviewing === flag.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Uphold
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(flag.id, "DISMISSED")}
                        disabled={reviewing === flag.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
