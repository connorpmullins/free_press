"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, AlertTriangle, FileQuestion, FileEdit } from "lucide-react";

interface ArticleCardProps {
  article: {
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
    sourceCount?: number;
    integrityLabels: string[];
    correctionCount: number;
  };
}

const labelConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  SUPPORTED: {
    label: "Supported",
    variant: "default",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  DISPUTED: {
    label: "Disputed",
    variant: "destructive",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  NEEDS_SOURCE: {
    label: "Needs Source",
    variant: "secondary",
    icon: <FileQuestion className="h-3 w-3" />,
  },
  CORRECTION_ISSUED: {
    label: "Correction Issued",
    variant: "outline",
    icon: <FileEdit className="h-3 w-3" />,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    variant: "secondary",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

export function ArticleCard({ article }: ArticleCardProps) {
  const initials = article.author.pseudonym
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <article className="border rounded-lg p-5 hover:border-foreground/20 transition-colors">
      {/* Integrity labels */}
      {article.integrityLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {article.integrityLabels.map((label) => {
            const config = labelConfig[label];
            if (!config) return null;
            return (
              <Badge
                key={label}
                variant={config.variant}
                className="text-xs gap-1"
              >
                {config.icon}
                {config.label}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Title */}
      <Link href={`/article/${article.slug}`}>
        <h2 className="text-lg font-semibold mb-2 hover:underline leading-tight">
          {article.title}
        </h2>
      </Link>

      {/* Summary */}
      {article.summary && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {article.summary}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Link
          href={`/author/${article.author.pseudonym}`}
          className="flex items-center gap-2 hover:text-foreground"
        >
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{article.author.pseudonym}</span>
          {article.author.verified && (
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
          )}
        </Link>

        {article.publishedAt && (
          <>
            <span className="text-muted-foreground/50">·</span>
            <time>
              {formatDistanceToNow(new Date(article.publishedAt), {
                addSuffix: true,
              })}
            </time>
          </>
        )}

        {article.sourceCount !== undefined && article.sourceCount > 0 && (
          <>
            <span className="text-muted-foreground/50">·</span>
            <span>
              {article.sourceCount} source{article.sourceCount !== 1 ? "s" : ""}
            </span>
          </>
        )}

        {article.correctionCount > 0 && (
          <>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-amber-600">
              {article.correctionCount} correction
              {article.correctionCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>
    </article>
  );
}
