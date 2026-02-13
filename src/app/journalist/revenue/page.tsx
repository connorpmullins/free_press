"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueEntry {
  id: string;
  period: string;
  amount: number;
  reads: number;
  integrityMultiplier: number;
  status: string;
  paidAt: string | null;
}

export default function JournalistRevenuePage() {
  const { user, loading: authLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "JOURNALIST") return;

    async function fetchRevenue() {
      try {
        const res = await fetch("/api/profile/revenue");
        if (!res.ok) return;
        const data = await res.json();
        setEntries(data.data.entries ?? []);
        setTotalEarnings(data.data.totalEarnings ?? 0);
        setPendingEarnings(data.data.pendingEarnings ?? 0);
      } finally {
        setLoading(false);
      }
    }

    fetchRevenue();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!user || user.role !== "JOURNALIST") {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">This page is for journalists only.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Revenue</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${pendingEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue History</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-muted-foreground">No revenue entries yet.</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-3 flex items-center gap-3">
                  <div>
                    <p className="font-medium">{entry.period}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.reads} reads · multiplier {entry.integrityMultiplier.toFixed(2)}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {entry.status}
                  </Badge>
                  <p className="font-semibold w-24 text-right">${entry.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
