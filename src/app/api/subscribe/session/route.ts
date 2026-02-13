import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isStripeEnabled, retrieveCheckoutSession } from "@/lib/stripe";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/subscribe/session?session_id=cs_... - Retrieve checkout session details
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    if (!isStripeEnabled()) {
      return errorResponse("Billing is temporarily unavailable", 503);
    }

    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return errorResponse("Missing session_id parameter", 400);
    }

    const session = await retrieveCheckoutSession(sessionId);
    if (!session) {
      return errorResponse("Failed to retrieve session", 500);
    }

    return successResponse(session);
  } catch (error) {
    return handleApiError(error);
  }
}
