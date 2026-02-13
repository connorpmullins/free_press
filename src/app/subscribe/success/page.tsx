"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

interface SessionDetails {
  plan: string | null;
  status: string | null;
  customerEmail: string | null;
  currentPeriodEnd: string | null;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) return;

    async function fetchSession() {
      try {
        const res = await fetch(
          `/api/subscribe/session?session_id=${encodeURIComponent(sessionId!)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSession(data.data);
        }
      } catch {
        // Non-critical — show generic success if fetch fails
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  const planLabel =
    session?.plan === "year"
      ? "Annual"
      : session?.plan === "month"
        ? "Monthly"
        : null;

  return (
    <div className="container max-w-md mx-auto px-4 py-20">
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Welcome aboard!</h1>
          <p className="text-muted-foreground mb-4">
            Thank you for supporting independent journalism. You now have full
            access to all articles on Free Press.
          </p>

          {loading ? (
            <div className="flex justify-center mb-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : session ? (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-sm text-left space-y-1">
              {planLabel && (
                <p>
                  <span className="text-muted-foreground">Plan:</span>{" "}
                  <span className="font-medium">{planLabel}</span>
                </p>
              )}
              {session.customerEmail && (
                <p>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="font-medium">{session.customerEmail}</span>
                </p>
              )}
              {session.currentPeriodEnd && (
                <p>
                  <span className="text-muted-foreground">Next billing:</span>{" "}
                  <span className="font-medium">
                    {new Date(session.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </p>
              )}
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <Link href="/feed">
              <Button className="w-full">Start Reading</Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full">
                Manage Subscription
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-md mx-auto px-4 py-20">
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
