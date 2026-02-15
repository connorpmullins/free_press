"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Loader2, Plus, Trash2, Save, Send } from "lucide-react";
import { useUser } from "@/components/providers";
import { toast } from "sonner";
import { createArticleSchema } from "@/lib/validations";

interface SourceInput {
  sourceType: string;
  quality: string;
  url: string;
  title: string;
  description: string;
  isAnonymous: boolean;
}

const emptySource: SourceInput = {
  sourceType: "SECONDARY_REPORT",
  quality: "SECONDARY",
  url: "",
  title: "",
  description: "",
  isAnonymous: false,
};

export default function WriteArticlePage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      }
    >
      <WriteArticleContent />
    </Suspense>
  );
}

function WriteArticleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [contentJson, setContentJson] = useState<unknown>(null);
  const [contentText, setContentText] = useState("");
  const [sources, setSources] = useState<SourceInput[]>([{ ...emptySource }]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [articleStatus, setArticleStatus] = useState<string>("DRAFT");
  const [changeNote, setChangeNote] = useState("");

  useEffect(() => {
    if (!editId) return;
    setLoadingDraft(true);
    void (async () => {
      try {
        const res = await fetch(`/api/articles/${editId}`);
        if (!res.ok) return;
        const data = await res.json();
        const article = data.data;
        setTitle(article.title ?? "");
        setSummary(article.summary ?? "");
        setContentJson(article.content ?? null);
        setContentText(article.contentText ?? "");
        if (article.status) setArticleStatus(article.status);
        if (article.sources && article.sources.length > 0) {
          setSources(
            article.sources.map((s: Record<string, unknown>) => ({
              sourceType: (s.sourceType as string) || "SECONDARY_REPORT",
              quality: (s.quality as string) || "SECONDARY",
              url: (s.url as string) || "",
              title: (s.title as string) || "",
              description: (s.description as string) || "",
              isAnonymous: Boolean(s.isAnonymous),
            }))
          );
        }
      } finally {
        setLoadingDraft(false);
      }
    })();
  }, [editId]);

  // Clear validation errors whenever form data changes
  const hasErrors = useRef(false);
  hasErrors.current = !!(error || Object.keys(fieldErrors).length > 0);
  useEffect(() => {
    if (hasErrors.current) {
      setError(null);
      setFieldErrors({});
    }
  }, [title, summary, contentText, sources]);

  if (!user || user.role !== "JOURNALIST") {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">
          You must be a verified journalist to write articles.
        </p>
      </div>
    );
  }

  function addSource() {
    setSources([...sources, { ...emptySource }]);
  }

  function removeSource(index: number) {
    setSources(sources.filter((_, i) => i !== index));
  }

  function updateSource(index: number, field: keyof SourceInput, value: string | boolean) {
    const updated = [...sources];
    updated[index] = { ...updated[index], [field]: value };
    setSources(updated);
  }

  function isSourceComplete(source: SourceInput): boolean {
    return !!(source.title && source.sourceType && source.quality);
  }

  function validate(): boolean {
    const result = createArticleSchema.safeParse({
      title,
      summary,
      content: contentJson,
      contentText,
      sources: sources.filter((s) => s.title),
    });

    if (result.success) {
      setFieldErrors({});
      return true;
    }

    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !errors[key]) {
        errors[key] = issue.message;
      }
    }
    setFieldErrors(errors);
    setError(null);
    return false;
  }

  const isPublished = articleStatus === "PUBLISHED";

  async function handleSave() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    if (!validate()) {
      setSaving(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        title,
        summary,
        content: contentJson,
        contentText,
        sources: sources.filter((s) => s.title),
      };

      // Published articles require a change note
      if (isPublished && editId) {
        if (!changeNote.trim()) {
          setFieldErrors({ changeNote: "A change note is required when updating a published article." });
          setSaving(false);
          return;
        }
        payload.changeNote = changeNote;
      }

      const res = await fetch(editId ? `/api/articles/${editId}` : "/api/articles", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(isPublished ? "Article updated" : editId ? "Draft updated" : "Article saved as draft");
        router.push("/journalist/dashboard");
      } else {
        setError(`Error saving: ${data.error || "Failed to save article"}`);
      }
    } catch {
      setError("Error saving: Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    setFieldErrors({});
    if (!validate()) {
      setPublishing(false);
      return;
    }

    // For published articles, "Publish" becomes "Update" — just save with changeNote
    if (isPublished && editId) {
      if (!changeNote.trim()) {
        setFieldErrors({ changeNote: "A change note is required when updating a published article." });
        setPublishing(false);
        return;
      }
      try {
        const res = await fetch(`/api/articles/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            summary,
            content: contentJson,
            contentText,
            changeNote,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success("Article updated");
          router.push("/journalist/dashboard");
        } else {
          setError(`Error updating: ${data.error || "Failed to update article"}`);
        }
      } catch {
        setError("Error updating: Network error. Please try again.");
      } finally {
        setPublishing(false);
      }
      return;
    }

    try {
      let articleId = editId;
      if (!articleId) {
        // First save as draft
        const createRes = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            summary,
            content: contentJson,
            contentText,
            sources: sources.filter((s) => s.title),
          }),
        });

        const createData = await createRes.json();

        if (!createRes.ok) {
          setError(`Error publishing: ${createData.error || "Failed to save article"}`);
          return;
        }
        articleId = createData.data.article.id;
      } else {
        // Save current edits before publishing
        const saveRes = await fetch(`/api/articles/${articleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            summary,
            content: contentJson,
            contentText,
          }),
        });

        if (!saveRes.ok) {
          const saveData = await saveRes.json();
          setError(`Error publishing: ${saveData.error || "Failed to save changes before publishing"}`);
          return;
        }
      }

      // Then publish
      const publishRes = await fetch(
        `/api/articles/${articleId}/publish`,
        { method: "POST" }
      );

      const publishData = await publishRes.json();

      if (publishRes.ok) {
        if (publishData.data.status === "HELD") {
          toast.info("Article held for review");
        } else {
          toast.success("Article published!");
        }
        router.push("/journalist/dashboard");
      } else {
        setError(`Error publishing: ${publishData.error || "Failed to publish article"}`);
      }
    } catch {
      setError("Error publishing: Network error. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Write Article</h1>
      {loadingDraft && (
        <Alert className="mb-6">
          <AlertDescription>Loading draft...</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Article title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg"
          />
          {fieldErrors.title && (
            <p className="text-sm text-destructive">{fieldErrors.title}</p>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <Label htmlFor="summary">Summary (optional)</Label>
          <Textarea
            id="summary"
            placeholder="Brief summary of the article"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={300}
            rows={2}
          />
          <p className="text-xs text-muted-foreground text-right">
            {summary.length}/300
          </p>
          {fieldErrors.summary && (
            <p className="text-sm text-destructive">{fieldErrors.summary}</p>
          )}
        </div>

        {/* Editor */}
        <div className="space-y-2">
          <Label>Content</Label>
          <RichTextEditor
            content={contentJson}
            onChange={(json, text) => {
              setContentJson(json);
              setContentText(text);
            }}
          />
          {fieldErrors.contentText && (
            <p className="text-sm text-destructive">{fieldErrors.contentText}</p>
          )}
        </div>

        {/* Sources */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Sources</CardTitle>
              <Badge variant="secondary">{sources.length} sources</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sources.map((source, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    Source #{index + 1}
                    {isSourceComplete(source) && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </span>
                  {sources.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeSource(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={source.sourceType}
                      onValueChange={(v) =>
                        updateSource(index, "sourceType", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIMARY_DOCUMENT">
                          Primary Document
                        </SelectItem>
                        <SelectItem value="OFFICIAL_STATEMENT">
                          Official Statement
                        </SelectItem>
                        <SelectItem value="INTERVIEW">Interview</SelectItem>
                        <SelectItem value="PUBLIC_RECORD">
                          Public Record
                        </SelectItem>
                        <SelectItem value="SECONDARY_REPORT">
                          Secondary Report
                        </SelectItem>
                        <SelectItem value="DATASET">Dataset</SelectItem>
                        <SelectItem value="MULTIMEDIA">Multimedia</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Quality</Label>
                    <Select
                      value={source.quality}
                      onValueChange={(v) =>
                        updateSource(index, "quality", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIMARY">Primary</SelectItem>
                        <SelectItem value="SECONDARY">Secondary</SelectItem>
                        <SelectItem value="ANONYMOUS">Anonymous</SelectItem>
                        <SelectItem value="UNVERIFIABLE">
                          Unverifiable
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input
                    placeholder="Source title"
                    value={source.title}
                    onChange={(e) =>
                      updateSource(index, "title", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">URL (optional)</Label>
                  <Input
                    placeholder="https://..."
                    value={source.url}
                    onChange={(e) =>
                      updateSource(index, "url", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Description (optional)</Label>
                  <Input
                    placeholder="Brief description"
                    value={source.description}
                    onChange={(e) =>
                      updateSource(index, "description", e.target.value)
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={source.isAnonymous}
                    onCheckedChange={(checked) =>
                      updateSource(index, "isAnonymous", checked)
                    }
                  />
                  <Label className="text-xs">Anonymous source</Label>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={addSource}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
            {fieldErrors.sources && (
              <p className="text-sm text-destructive">{fieldErrors.sources}</p>
            )}
          </CardContent>
        </Card>

        {/* Change note (required for published articles) */}
        {isPublished && (
          <div className="space-y-2">
            <Label htmlFor="changeNote">Change Note (required)</Label>
            <Textarea
              id="changeNote"
              placeholder="Describe what changed in this update"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              maxLength={500}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              This will be visible in the article&apos;s version history.
            </p>
            {fieldErrors.changeNote && (
              <p className="text-sm text-destructive">{fieldErrors.changeNote}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex gap-3 justify-end">
            {!isPublished && (
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving || publishing}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Draft
              </Button>
            )}
            <Button
              onClick={handlePublish}
              disabled={saving || publishing}
            >
              {publishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isPublished ? "Update Article" : "Publish"}
            </Button>
          </div>
          {(error || Object.keys(fieldErrors).length > 0) && (
            <p className="text-sm text-destructive text-right">
              {error || "Please fix the errors above before continuing."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
