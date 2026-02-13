"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Plus, Trash2, Save, Send } from "lucide-react";
import { useUser } from "@/components/providers";
import { toast } from "sonner";

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
  const router = useRouter();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [contentJson, setContentJson] = useState<unknown>(null);
  const [contentText, setContentText] = useState("");
  const [sources, setSources] = useState<SourceInput[]>([{ ...emptySource }]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/articles", {
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

      const data = await res.json();

      if (res.ok) {
        toast.success("Article saved as draft");
        router.push("/journalist/dashboard");
      } else {
        setError(data.error || "Failed to save article");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError(null);

    try {
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
        setError(createData.error || "Failed to save article");
        return;
      }

      // Then publish
      const publishRes = await fetch(
        `/api/articles/${createData.data.article.id}/publish`,
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
        setError(publishData.error || "Failed to publish article");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Write Article</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
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
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <Label htmlFor="summary">Summary (optional)</Label>
          <Textarea
            id="summary"
            placeholder="Brief summary of the article"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
          />
        </div>

        {/* Editor */}
        <div className="space-y-2">
          <Label>Content</Label>
          <RichTextEditor
            onChange={(json, text) => {
              setContentJson(json);
              setContentText(text);
            }}
          />
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
                  <span className="text-sm font-medium">
                    Source #{index + 1}
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
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving || publishing || !title || !contentText}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={
              saving || publishing || !title || !contentText || sources.every((s) => !s.title)
            }
          >
            {publishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
