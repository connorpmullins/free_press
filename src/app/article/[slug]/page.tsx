"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  AlertTriangle,
  FileQuestion,
  FileEdit,
  Bookmark,
  BookmarkCheck,
  Flag,
  ExternalLink,
  Lock,
  Clock,
  Shield,
  Ban,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useUser } from "@/components/providers";
import { toast } from "sonner";

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: unknown;
  contentPreview: boolean;
  status: string;
  version: number;
  publishedAt: string | null;
  createdAt: string;
  sourceComplete: boolean;
  author: {
    id: string;
    pseudonym: string;
    bio: string | null;
    beats: string[];
    reputationScore: number;
    verified: boolean;
    avatarUrl: string | null;
    articleCount: number;
  };
  sources: Array<{
    id: string;
    sourceType: string;
    quality: string;
    url: string | null;
    title: string;
    description: string | null;
    isAnonymous: boolean;
  }>;
  integrityLabels: Array<{
    id: string;
    labelType: string;
    reason: string | null;
    createdAt: string;
  }>;
  corrections: Array<{
    id: string;
    content: string;
    severity: string;
    createdAt: string;
  }>;
  versionHistory: Array<{
    version: number;
    changeNote: string | null;
    createdAt: string;
  }>;
  bookmarkCount: number;
  isBookmarked: boolean;
}

function renderContent(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;

  // Render Tiptap JSON to HTML (simplified)
  function renderNode(node: { type?: string; content?: unknown[]; text?: string; attrs?: Record<string, string>; marks?: Array<{ type: string }> }): string {
    if (!node) return "";

    if (node.type === "text") {
      let text = node.text || "";
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === "bold") text = `<strong>${text}</strong>`;
          if (mark.type === "italic") text = `<em>${text}</em>`;
          if (mark.type === "code") text = `<code>${text}</code>`;
        }
      }
      return text;
    }

    const children = (node.content as Array<{ type?: string; content?: unknown[]; text?: string; attrs?: Record<string, string>; marks?: Array<{ type: string }> }>)?.map(renderNode).join("") || "";

    switch (node.type) {
      case "doc":
        return children;
      case "paragraph":
        return `<p>${children}</p>`;
      case "heading":
        const level = node.attrs?.level || 2;
        return `<h${level}>${children}</h${level}>`;
      case "blockquote":
        return `<blockquote>${children}</blockquote>`;
      case "codeBlock":
        return `<pre><code>${children}</code></pre>`;
      case "bulletList":
        return `<ul>${children}</ul>`;
      case "orderedList":
        return `<ol>${children}</ol>`;
      case "listItem":
        return `<li>${children}</li>`;
      case "horizontalRule":
        return "<hr />";
      case "image":
        return `<img src="${node.attrs?.src || ""}" alt="${node.attrs?.alt || ""}" />`;
      case "videoEmbed": {
        const src = node.attrs?.src || "";
        return `<div class="relative w-full aspect-video my-4"><iframe src="${src}" class="absolute inset-0 w-full h-full rounded-lg" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
      }
      default:
        return children;
    }
  }

  return renderNode(content as Parameters<typeof renderNode>[0]);
}

export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user } = useUser();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [correctionContent, setCorrectionContent] = useState("");
  const [correctionSeverity, setCorrectionSeverity] = useState("TYPO");
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/articles/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data.data);
          setBookmarked(data.data.isBookmarked);
        }
      } catch (error) {
        console.error("Failed to fetch article:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [slug]);

  useEffect(() => {
    if (!article || article.contentPreview) return;
    void fetch(`/api/articles/${article.id}/read`, { method: "POST" });
  }, [article]);

  async function toggleBookmark() {
    if (!article || !user) return;
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: article.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setBookmarked(data.data.bookmarked);
    }
  }

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Article not found</h1>
        <Link href="/feed">
          <Button>Back to feed</Button>
        </Link>
      </div>
    );
  }

  // Tombstone view for withdrawn articles
  if (article.status === "REMOVED") {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Article Withdrawn</h1>
        <p className="text-muted-foreground mb-2">
          This article was withdrawn by the author.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Originally published by{" "}
          <Link href={`/author/${article.author.pseudonym}`} className="text-primary hover:underline">
            {article.author.pseudonym}
          </Link>
          {article.publishedAt && (
            <> on {format(new Date(article.publishedAt), "MMM d, yyyy")}</>
          )}
        </p>
        <Link href="/feed">
          <Button variant="outline">Back to feed</Button>
        </Link>
      </div>
    );
  }

  async function handleSubmitCorrection() {
    if (!article) return;
    if (correctionContent.trim().length < 10) {
      toast.error("Correction must be at least 10 characters.");
      return;
    }
    setSubmittingCorrection(true);
    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: article.id,
          content: correctionContent,
          severity: correctionSeverity,
        }),
      });
      if (res.ok) {
        toast.success("Correction issued successfully");
        setCorrectionContent("");
        setCorrectionSeverity("TYPO");
        // Refresh article data to show the new correction
        const refreshRes = await fetch(`/api/articles/${slug}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setArticle(refreshData.data);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to issue correction");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmittingCorrection(false);
    }
  }

  const isAuthor = user?.id === article.author.id;

  const authorInitials = article.author.pseudonym
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      {/* Integrity labels */}
      {article.integrityLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.integrityLabels.map((label) => (
            <Badge
              key={label.id}
              variant={
                label.labelType === "DISPUTED"
                  ? "destructive"
                  : label.labelType === "SUPPORTED"
                  ? "default"
                  : "secondary"
              }
              className="gap-1"
            >
              {label.labelType === "DISPUTED" && (
                <AlertTriangle className="h-3 w-3" />
              )}
              {label.labelType === "NEEDS_SOURCE" && (
                <FileQuestion className="h-3 w-3" />
              )}
              {label.labelType === "CORRECTION_ISSUED" && (
                <FileEdit className="h-3 w-3" />
              )}
              {label.labelType === "SUPPORTED" && (
                <CheckCircle className="h-3 w-3" />
              )}
              {label.labelType.replace("_", " ")}
            </Badge>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
        {article.title}
      </h1>

      {/* Author & meta */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/author/${article.author.pseudonym}`}>
          <Avatar className="h-10 w-10">
            <AvatarFallback>{authorInitials}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/author/${article.author.pseudonym}`}
              className="font-medium hover:underline"
            >
              {article.author.pseudonym}
            </Link>
            {article.author.verified && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Shield className="h-3 w-3" />
                Verified contributor
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {article.publishedAt && (
              <time className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(article.publishedAt), "MMM d, yyyy")}
              </time>
            )}
            <span>·</span>
            <span>v{article.version}</span>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          {user && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleBookmark}
                title={bookmarked ? "Remove bookmark" : "Bookmark"}
              >
                {bookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
              <Link href={`/flag?articleId=${article.id}`}>
                <Button variant="ghost" size="icon" title="Flag this article">
                  <Flag className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Corrections — shown at top before content */}
      {article.corrections.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Corrections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {article.corrections.map((correction) => (
                <li
                  key={correction.id}
                  className="border-l-2 border-amber-400 pl-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {correction.severity}
                    </Badge>
                    <time className="text-xs text-muted-foreground">
                      {format(new Date(correction.createdAt), "MMM d, yyyy")}
                    </time>
                  </div>
                  <p className="text-sm">{correction.content}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {article.contentPreview ? (
        <div className="space-y-6">
          {article.summary && (
            <p className="text-lg text-muted-foreground">{article.summary}</p>
          )}
          <div className="bg-muted/50 border rounded-lg p-8 text-center">
            <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">
              Subscribe to read the full article
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Support independent investigative journalism for $5/month
            </p>
            <Link href="/subscribe">
              <Button>Subscribe Now</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div
          className="prose prose-neutral max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(renderContent(article.content), {
              allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                "h1", "h2", "h3", "h4", "h5", "h6", "img", "pre", "code",
                "iframe",
              ]),
              allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                img: ["src", "alt", "width", "height"],
                a: ["href", "target", "rel"],
                div: ["class", "data-video-embed"],
                iframe: ["src", "class", "frameborder", "allow", "allowfullscreen"],
              },
              allowedIframeHostnames: [
                "www.youtube.com",
                "player.vimeo.com",
              ],
            }),
          }}
        />
      )}

      <Separator className="my-8" />

      {/* Sources */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Sources
            {article.sourceComplete ? (
              <Badge variant="secondary" className="text-xs gap-1">
                <CheckCircle className="h-3 w-3" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs gap-1">
                <FileQuestion className="h-3 w-3" />
                Incomplete
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {article.sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sources attached.
            </p>
          ) : (
            <ul className="space-y-3">
              {article.sources.map((source) => (
                <li
                  key={source.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <Badge variant="outline" className="text-xs shrink-0 mt-0.5 min-w-[165px] justify-center">
                    {source.sourceType.replace("_", " ")}
                  </Badge>
                  <div>
                    <p className="font-medium">{source.title}</p>
                    {source.description && (
                      <p className="text-muted-foreground">
                        {source.description}
                      </p>
                    )}
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 mt-0.5"
                      >
                        View source
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {source.isAnonymous && (
                      <span className="text-muted-foreground italic">
                        Anonymous source
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Issue Correction form — visible only to the article's author */}
      {isAuthor && article.status === "PUBLISHED" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Issue a Correction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="correction-severity">Severity</Label>
              <Select value={correctionSeverity} onValueChange={setCorrectionSeverity}>
                <SelectTrigger id="correction-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TYPO">Typo</SelectItem>
                  <SelectItem value="CLARIFICATION">Clarification</SelectItem>
                  <SelectItem value="FACTUAL_ERROR">Factual Error</SelectItem>
                  <SelectItem value="MATERIAL_ERROR">Material Error</SelectItem>
                  <SelectItem value="RETRACTION">Retraction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="correction-content">Correction Details</Label>
              <Textarea
                id="correction-content"
                placeholder="Describe the correction (min 10 characters)"
                value={correctionContent}
                onChange={(e) => setCorrectionContent(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={handleSubmitCorrection}
              disabled={submittingCorrection || correctionContent.trim().length < 10}
            >
              {submittingCorrection ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileEdit className="mr-2 h-4 w-4" />
              )}
              Submit Correction
            </Button>
            <p className="text-xs text-muted-foreground">
              Corrections are public and affect your reputation score. Voluntary corrections for minor issues have minimal impact.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Version history */}
      {article.versionHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Version History</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {article.versionHistory.map((v) => (
                <li key={v.version} className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="text-xs">
                    v{v.version}
                  </Badge>
                  <span className="text-muted-foreground">
                    {v.changeNote || "Updated"}
                  </span>
                  <time className="text-xs text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(v.createdAt), {
                      addSuffix: true,
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
