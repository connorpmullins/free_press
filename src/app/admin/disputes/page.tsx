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
import { AlertTriangle, CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface DisputeData {
  id: string;
  reason: string;
  evidence: string | null;
  status: string;
  resolution: string | null;
  createdAt: string;
  article: {
    id: string;
    title: string;
    slug: string;
    authorId: string;
    author: {
      displayName: string | null;
      journalistProfile: { pseudonym: string } | null;
    };
  };
  submitter: {
    id: string;
    displayName: string | null;
  };
  appeal: {
    id: string;
    status: string;
  } | null;
}

export default function AdminDisputesPage() {
  const { user } = useUser();
  const [disputes, setDisputes] = useState<DisputeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("OPEN");
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;

    async function fetchDisputes() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/disputes?status=${filter}`);
        if (res.ok) {
          const data = await res.json();
          setDisputes(data.data.disputes);
        }
      } catch (error) {
        console.error("Failed to fetch disputes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDisputes();
  }, [user, filter]);

  async function handleResolve(
    disputeId: string,
    status: "UPHELD" | "OVERTURNED" | "DISMISSED"
  ) {
    const resolution = resolutions[disputeId];
    if (!resolution) {
      toast.error("Please provide a resolution");
      return;
    }

    setResolving(disputeId);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId, status, resolution }),
      });

      if (res.ok) {
        toast.success(`Dispute ${status.toLowerCase()}`);
        setDisputes(disputes.filter((d) => d.id !== disputeId));
      }
    } catch {
      toast.error("Failed to resolve dispute");
    } finally {
      setResolving(null);
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
          <AlertTriangle className="h-6 w-6" />
          Disputes
        </h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="UPHELD">Upheld</SelectItem>
            <SelectItem value="OVERTURNED">Overturned</SelectItem>
            <SelectItem value="DISMISSED">Dismissed</SelectItem>
            <SelectItem value="ALL">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No {filter.toLowerCase().replace("_", " ")} disputes.
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <a
                      href={`/article/${dispute.article.slug}`}
                      className="font-medium hover:underline"
                    >
                      {dispute.article.title}
                    </a>
                    <p className="text-sm text-muted-foreground">
                      by{" "}
                      {dispute.article.author.journalistProfile?.pseudonym ||
                        dispute.article.author.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Disputed by {dispute.submitter.displayName || "Anonymous"}{" "}
                      on {new Date(dispute.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      dispute.status === "OPEN"
                        ? "destructive"
                        : dispute.status === "UPHELD"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {dispute.status}
                  </Badge>
                </div>

                <div className="bg-muted/50 rounded p-3">
                  <p className="text-sm font-medium mb-1">Dispute Reason:</p>
                  <p className="text-sm text-muted-foreground">
                    {dispute.reason}
                  </p>
                  {dispute.evidence && (
                    <>
                      <p className="text-sm font-medium mt-2 mb-1">Evidence:</p>
                      <p className="text-sm text-muted-foreground">
                        {dispute.evidence}
                      </p>
                    </>
                  )}
                </div>

                {(dispute.status === "OPEN" ||
                  dispute.status === "UNDER_REVIEW") && (
                  <div className="space-y-2 pt-2 border-t">
                    <Textarea
                      placeholder="Resolution (required)"
                      className="text-sm"
                      rows={3}
                      value={resolutions[dispute.id] || ""}
                      onChange={(e) =>
                        setResolutions({
                          ...resolutions,
                          [dispute.id]: e.target.value,
                        })
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleResolve(dispute.id, "UPHELD")}
                        disabled={resolving === dispute.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Uphold
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(dispute.id, "OVERTURNED")}
                        disabled={resolving === dispute.id}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Overturn
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResolve(dispute.id, "DISMISSED")}
                        disabled={resolving === dispute.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}

                {dispute.resolution && (
                  <div className="border-l-2 pl-3">
                    <p className="text-sm font-medium">Resolution:</p>
                    <p className="text-sm text-muted-foreground">
                      {dispute.resolution}
                    </p>
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
