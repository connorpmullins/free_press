"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronUp, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  decisionLog: string | null;
  createdAt: string;
  author: string | null;
  voteCount: number;
  hasVoted: boolean;
}

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  OPEN: "secondary",
  PLANNED: "default",
  NOT_PLANNED: "outline",
  IN_PROGRESS: "default",
  SHIPPED: "default",
};

export default function FeedbackPage() {
  const { user } = useUser();
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/feature-requests?sort=votes");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      if (res.ok) {
        toast.success("Feature request submitted!");
        setTitle("");
        setDescription("");
        setDialogOpen(false);
        fetchRequests();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(id: string) {
    if (!user) {
      toast.error("Sign in to vote");
      return;
    }

    try {
      const res = await fetch(`/api/feature-requests/${id}/vote`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setRequests(
          requests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  hasVoted: data.data.voted,
                  voteCount: r.voteCount + (data.data.voted ? 1 : -1),
                }
              : r
          )
        );
      }
    } catch {
      toast.error("Failed to vote");
    }
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Feature Requests</h1>
          <p className="text-muted-foreground">
            Help shape the future of Free Press
          </p>
        </div>
        {user && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Feature Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Brief title for your request"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the feature you'd like to see..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={submitting || !title || !description}
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No feature requests yet. Be the first!
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4 flex items-start gap-4">
                <button
                  onClick={() => handleVote(request.id)}
                  className={`flex flex-col items-center gap-0.5 min-w-[48px] py-1.5 rounded-lg transition-colors ${
                    request.hasVoted
                      ? "bg-primary/10 text-primary"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span className="text-sm font-bold">
                    {request.voteCount}
                  </span>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{request.title}</h3>
                    <Badge
                      variant={statusColors[request.status] || "secondary"}
                      className="text-xs"
                    >
                      {request.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.description}
                  </p>
                  {request.decisionLog && (
                    <p className="text-xs text-muted-foreground mt-2 italic border-l-2 pl-2">
                      {request.decisionLog}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
