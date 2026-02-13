"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ApplyPage() {
  const { user, refetch } = useUser();
  const router = useRouter();
  const [pseudonym, setPseudonym] = useState("");
  const [bio, setBio] = useState("");
  const [beats, setBeats] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user?.role === "JOURNALIST") {
    return (
      <div className="container max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">
          You&apos;re already a contributor
        </h1>
        <p className="text-muted-foreground mb-6">
          Head to your dashboard to start writing.
        </p>
        <Button onClick={() => router.push("/journalist/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudonym,
          bio,
          beats: beats
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Application submitted!");
        await refetch();
        router.push("/journalist/dashboard");
      } else {
        setError(data.error || "Failed to submit application");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Become a Contributor</CardTitle>
          <CardDescription>
            Join Free Press as a verified journalist. You&apos;ll need to verify
            your identity before publishing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!user && (
            <Alert className="mb-4">
              <AlertDescription>
                You need to{" "}
                <a href="/auth/login" className="font-medium underline">
                  sign in
                </a>{" "}
                first before applying.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pseudonym">Pseudonym / Byline *</Label>
              <Input
                id="pseudonym"
                placeholder="e.g. J.Doe, InvestigativeJ"
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                This is the name that will appear on your articles. Letters,
                numbers, dashes, and underscores only.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell readers about your experience and focus areas..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beats">Beats (comma separated)</Label>
              <Input
                id="beats"
                placeholder="e.g. Technology, Politics, Finance"
                value={beats}
                onChange={(e) => setBeats(e.target.value)}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">What happens next:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Your contributor account is created</li>
                <li>Complete identity verification (Stripe Identity)</li>
                <li>Once verified, you can publish articles and earn revenue</li>
              </ol>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !user || !pseudonym}
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply to Contribute
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
