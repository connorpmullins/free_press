"use client";

import { useState } from "react";
import { useUser } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, loading: authLoading, refetch } = useUser();
  const [displayName, setDisplayName] = useState("");
  const [pseudonym, setPseudonym] = useState("");
  const [bio, setBio] = useState("");
  const [beats, setBeats] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [startingVerification, setStartingVerification] = useState(false);
  const [startingConnect, setStartingConnect] = useState(false);

  if (!initialized && user) {
    setDisplayName(user.displayName || "");
    setPseudonym(user.journalistProfile?.pseudonym || "");
    setBio(user.journalistProfile?.bio || "");
    setBeats(user.journalistProfile?.beats?.join(", ") || "");
    setInitialized(true);
  }

  if (authLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign in required</h1>
        <p className="text-muted-foreground">
          Please sign in to access settings.
        </p>
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName || undefined,
          pseudonym: pseudonym || undefined,
          bio: bio || undefined,
          beats: beats
            ? beats
                .split(",")
                .map((b) => b.trim())
                .filter(Boolean)
            : undefined,
        }),
      });

      if (res.ok) {
        toast.success("Settings saved");
        await refetch();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function startVerification() {
    setStartingVerification(true);
    try {
      const res = await fetch("/api/profile/verification", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to start verification");
        return;
      }
      window.location.href = data.data.url;
    } catch {
      toast.error("Network error while starting verification");
    } finally {
      setStartingVerification(false);
    }
  }

  async function startConnectOnboarding() {
    setStartingConnect(true);
    try {
      const res = await fetch("/api/profile/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to start Connect onboarding");
        return;
      }
      window.location.href = data.data.url;
    } catch {
      toast.error("Network error while starting Connect onboarding");
    } finally {
      setStartingConnect(false);
    }
  }

  const profile = user.journalistProfile;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <div>
                <Badge variant="secondary">{user.role}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Journalist profile */}
        {user.role === "JOURNALIST" && (
          <Card>
            <CardHeader>
              <CardTitle>Journalist Profile</CardTitle>
              <CardDescription>Your public author profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pseudonym">Pseudonym / Byline</Label>
                <Input
                  id="pseudonym"
                  value={pseudonym}
                  onChange={(e) => setPseudonym(e.target.value)}
                  placeholder="Your pen name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell readers about yourself"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beats">Beats (comma separated)</Label>
                <Input
                  id="beats"
                  value={beats}
                  onChange={(e) => setBeats(e.target.value)}
                  placeholder="e.g. Technology, Politics, Finance"
                />
              </div>

              <Separator />

              {/* Verification status */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Identity Verification
                </Label>
                {profile?.verificationStatus === "VERIFIED" ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Verified</span>
                  </div>
                ) : profile?.verificationStatus === "PENDING" ? (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Verification in progress. This usually takes 1-2 business
                      days. If you already submitted documents, refresh shortly.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Identity verification is required to publish articles and
                      earn revenue. We use Stripe Identity for secure, privacy-preserving
                      verification.
                      <br />
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={startVerification}
                        disabled={startingVerification}
                      >
                        {startingVerification && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Start Verification
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Payouts (Stripe Connect)
                </Label>
                <Alert>
                  <AlertDescription>
                    {profile?.stripeConnectId
                      ? "Connect account linked. You can reopen onboarding to complete or update payout details."
                      : "Link your Stripe Connect account to receive payouts."}
                    <br />
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={startConnectOnboarding}
                      disabled={
                        startingConnect || profile?.verificationStatus !== "VERIFIED"
                      }
                    >
                      {startingConnect && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {profile?.stripeConnectId
                        ? "Manage Connect Account"
                        : "Set Up Connect"}
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {user.subscription?.status === "ACTIVE" ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge>Active</Badge>
                  <Badge variant="secondary">{user.subscription.plan}</Badge>
                </div>
                {user.subscription.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground">
                    Renews on{" "}
                    {new Date(
                      user.subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-3">
                  No active subscription.
                </p>
                <a href="/subscribe">
                  <Button size="sm">Subscribe</Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
