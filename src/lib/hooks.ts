"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================
// Auth hook
// ============================================================

interface UserData {
  id: string;
  email: string;
  displayName: string | null;
  role: "READER" | "JOURNALIST" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
  journalistProfile: {
    id: string;
    pseudonym: string;
    bio: string | null;
    beats: string[];
    avatarUrl: string | null;
    verificationStatus: string;
    stripeVerificationId: string | null;
    stripeConnectId: string | null;
    reputationScore: number;
    articleCount: number;
    totalEarnings: number;
  } | null;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
  } | null;
}

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  return { user, loading, logout, refetch: fetchUser };
}

// ============================================================
// Generic fetch hook
// ============================================================

export function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url!);
        if (!res.ok) throw new Error("Request failed");
        const json = await res.json();
        if (!cancelled) {
          setData(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  return { data, loading, error, refetch: () => setData(null) };
}
