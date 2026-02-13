"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const DEV_ACCOUNTS = [
  { email: "admin@freepress.news", label: "Admin", role: "ADMIN", color: "destructive" as const },
  { email: "elena.vasquez@example.com", label: "Elena Vasquez", role: "JOURNALIST", color: "default" as const },
  { email: "marcus.chen@example.com", label: "Marcus Chen", role: "JOURNALIST", color: "default" as const },
  { email: "james.wright@example.com", label: "James Wright", role: "JOURNALIST", color: "default" as const },
  { email: "priya.kapoor@example.com", label: "Priya Kapoor", role: "JOURNALIST", color: "default" as const },
  { email: "carlos.rivera@example.com", label: "Carlos Rivera", role: "JOURNALIST", color: "default" as const },
  { email: "reader@example.com", label: "Jane Reader", role: "READER (subscribed)", color: "secondary" as const },
  { email: "free-reader@example.com", label: "Free Reader", role: "READER (no subscription)", color: "outline" as const },
];

export default function DevLoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loginAs(email: string) {
    setLoading(email);
    setError(null);

    try {
      const res = await fetch("/api/auth/login/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create login token");
        return;
      }

      const data = await res.json();
      const token = data.data.token;

      // Navigate to verify endpoint which sets the session cookie and redirects
      window.location.href = `/auth/verify?token=${token}`;
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Dev Login</CardTitle>
          <CardDescription>
            Quick-switch between seeded test accounts. This page only works in development.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded p-3">{error}</div>
          )}

          {DEV_ACCOUNTS.map((account) => (
            <div
              key={account.email}
              className="flex items-center justify-between border rounded-lg p-3"
            >
              <div>
                <div className="font-medium text-sm">{account.label}</div>
                <div className="text-xs text-muted-foreground">{account.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={account.color}>{account.role}</Badge>
                <Button
                  size="sm"
                  onClick={() => loginAs(account.email)}
                  disabled={loading !== null}
                >
                  {loading === account.email ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Log in"
                  )}
                </Button>
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground pt-2">
            Clicking "Log in" creates a magic link token and immediately verifies it,
            setting a session cookie and redirecting to the appropriate dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
