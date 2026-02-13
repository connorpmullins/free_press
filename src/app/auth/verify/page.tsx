"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    error ? "error" : "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (error) {
      setStatus("error");
      switch (error) {
        case "missing_token":
          setMessage("No verification token provided.");
          break;
        case "invalid_token":
          setMessage("This link is invalid or has expired. Please request a new one.");
          break;
        case "verification_failed":
          setMessage("Verification failed. Please try again.");
          break;
        default:
          setMessage("An unexpected error occurred.");
      }
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    // The actual verification happens server-side at /api/auth/verify
    // If we're here with a token and no error, redirect to the API route
    window.location.href = `/api/auth/verify?token=${encodeURIComponent(token)}`;
  }, [token, error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === "loading" && "Verifying..."}
            {status === "success" && "Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Verifying your magic link...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="text-muted-foreground">
                You&apos;ve been signed in. Redirecting...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <p className="text-muted-foreground">{message}</p>
              <Link
                href="/auth/login"
                className="inline-block mt-4 text-sm font-medium underline underline-offset-4 hover:text-primary"
              >
                Back to login
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
