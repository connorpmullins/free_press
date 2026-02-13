"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/lib/hooks";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// ============================================================
// Auth Context
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

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refetch: async () => {},
});

export function useUser() {
  return useContext(AuthContext);
}

// ============================================================
// Providers wrapper
// ============================================================

export function Providers({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      <TooltipProvider>
        {children}
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </AuthContext.Provider>
  );
}
