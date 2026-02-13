"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const DEV_ACCOUNTS = [
  { email: "admin@freepress.news", label: "Admin", role: "ADMIN", color: "destructive" as const },
  { email: "elena.vasquez@example.com", label: "Journalist — E.Vasquez", role: "JOURNALIST", color: "default" as const },
  { email: "marcus.chen@example.com", label: "Journalist — M.Chen", role: "JOURNALIST", color: "default" as const },
  { email: "james.wright@example.com", label: "Journalist — J.Wright", role: "JOURNALIST", color: "default" as const },
  { email: "priya.kapoor@example.com", label: "Journalist — P.Kapoor", role: "JOURNALIST", color: "default" as const },
  { email: "carlos.rivera@example.com", label: "Journalist — C.Rivera", role: "JOURNALIST", color: "default" as const },
  { email: "reader@example.com", label: "Reader (subscribed)", role: "READER", color: "secondary" as const },
  { email: "free-reader@example.com", label: "Reader (free)", role: "READER", color: "outline" as const },
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
        setError(data.error || "Login failed");
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

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="container max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Not available in production.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Dev Login</CardTitle>
          <CardDescription>
            Quick login as any seeded account. Dev only — not available in production.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {error && (
            <p className="text-sm text-destructive mb-3">{error}</p>
          )}
          {DEV_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              variant="outline"
              className="w-full justify-between h-auto py-3"
              onClick={() => loginAs(account.email)}
              disabled={loading !== null}
            >
              <div className="text-left">
                <div className="font-medium">{account.label}</div>
                <div className="text-xs text-muted-foreground">{account.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={account.color}>{account.role}</Badge>
                {loading === account.email && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
