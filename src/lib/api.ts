import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";

export function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof AuthError) {
    return errorResponse(error.message, error.statusCode);
  }

  if (error instanceof ZodError) {
    const messages = error.issues.map((e) => e.message).join(", ");
    return errorResponse(messages, 400);
  }

  if (error instanceof Error) {
    // Don't leak internal errors in production
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "Internal server error";
    return errorResponse(message, 500);
  }

  return errorResponse("Internal server error", 500);
}

export function getIpAddress(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return undefined;
}

export function getUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent") || undefined;
}
