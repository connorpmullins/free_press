import { NextRequest } from "next/server";
import { createMagicLink } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api";

// DEV-ONLY: Returns raw magic link token for E2E tests.
// This endpoint MUST NOT exist in production.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
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
