"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SubscribePage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(plan: "monthly" | "annual") {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setLoading(plan);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(
          typeof data?.error === "string"
            ? data.error
            : "Unable to start checkout. Please try again."
        );
        return;
      }

      if (typeof data?.data?.url === "string") {
        window.location.href = data.data.url;
        return;
      }

      toast.error("Checkout URL missing. Please try again.");
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  const hasActiveSubscription = user?.subscription?.status === "ACTIVE";

  return (
    <div className="container max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">
          Support Independent Journalism
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Your subscription directly funds investigative reporting. 85% of
          revenue goes to journalists.
        </p>
      </div>

      {hasActiveSubscription ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Badge className="mb-4">Active Subscription</Badge>
            <h2 className="text-xl font-bold mb-2">
              You&apos;re a subscriber!
            </h2>
            <p className="text-muted-foreground">
              Thank you for supporting independent journalism.
              {user?.subscription?.currentPeriodEnd && (
                <span>
                  {" "}
                  Your subscription renews on{" "}
                  {new Date(
                    user.subscription.currentPeriodEnd
                  ).toLocaleDateString()}
                  .
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Monthly */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly</CardTitle>
              <CardDescription>Cancel anytime</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">$5</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  "Full access to all articles",
                  "Support independent journalists",
                  "85% goes directly to reporters",
                  "Cancel anytime",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                onClick={() => handleSubscribe("monthly")}
                disabled={!!loading}
              >
                {loading === "monthly" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Subscribe Monthly
              </Button>
            </CardContent>
          </Card>

          {/* Annual */}
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Annual</CardTitle>
                <Badge>Save 17%</Badge>
              </div>
              <CardDescription>Best value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">$50</span>
                <span className="text-muted-foreground">/year</span>
                <p className="text-sm text-muted-foreground mt-1">
                  $4.17/month
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  "Full access to all articles",
                  "Support independent journalists",
                  "85% goes directly to reporters",
                  "2 months free",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                onClick={() => handleSubscribe("annual")}
                disabled={!!loading}
              >
                {loading === "annual" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Subscribe Annually
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
