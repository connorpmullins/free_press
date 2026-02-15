import { NextRequest } from "next/server";
import { createMagicLink } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api";

function isDevLoginEnabled(): boolean {
  // Allow in local dev and Vercel Preview only. Never allow in Vercel Production.
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.ENABLE_DEV_LOGIN === "true";
}

// Dev-only route for local testing/E2E.
// Requires ENABLE_DEV_LOGIN=true and is never available in production builds.
export async function POST(request: NextRequest) {
  if (!isDevLoginEnabled()) {
    return errorResponse("Not available", 404);
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return errorResponse("Email required", 400);
    }

    const token = await createMagicLink(email);
    return successResponse({ token });
  } catch (error) {
    console.error("Test login error:", error);
    return errorResponse("Failed to create test login", 500);
  }
}
