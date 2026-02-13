import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStripeEnabled, createBillingPortalSession } from "@/lib/stripe";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// POST /api/subscribe/portal - Create a billing portal session
export async function POST() {
  try {
    const user = await requireAuth();

    if (!isStripeEnabled()) {
      return errorResponse("Billing is temporarily unavailable", 503);
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return errorResponse("No billing account found", 404);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portalUrl = await createBillingPortalSession(
      subscription.stripeCustomerId,
      `${appUrl}/settings`
    );

    if (!portalUrl) {
      return errorResponse("Failed to create billing portal session", 500);
    }

    return successResponse({ url: portalUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
