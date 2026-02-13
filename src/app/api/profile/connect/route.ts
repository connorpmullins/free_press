import { requireJournalist } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createConnectAccount,
  createConnectOnboardingLink,
  getConnectAccountStatus,
} from "@/lib/stripe";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/profile/connect - Current Connect account status for journalist
export async function GET() {
  try {
    const user = await requireJournalist();
    const profile = await db.journalistProfile.findUnique({
      where: { userId: user.id },
      select: { stripeConnectId: true },
    });

    if (!profile?.stripeConnectId) {
      return successResponse({ connected: false, account: null });
    }

    const account = await getConnectAccountStatus(profile.stripeConnectId);
    return successResponse({
      connected: true,
      account,
      payoutsReady: !!account?.payoutsEnabled && !!account?.detailsSubmitted,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/profile/connect - Create/reuse Connect account and return onboarding link
export async function POST() {
  try {
    const user = await requireJournalist();
    const profile = await db.journalistProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, verificationStatus: true, stripeConnectId: true },
    });

    if (!profile) {
      return errorResponse("Journalist profile not found", 404);
    }

    if (profile.verificationStatus !== "VERIFIED") {
      return errorResponse("Complete identity verification first", 403);
    }

    let accountId = profile.stripeConnectId;
    if (!accountId) {
      accountId = await createConnectAccount(user.email, user.id);
      if (!accountId) {
        return errorResponse("Stripe Connect is not configured", 503);
      }

      await db.journalistProfile.update({
        where: { id: profile.id },
        data: { stripeConnectId: accountId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const onboardingUrl = await createConnectOnboardingLink(
      accountId,
      `${appUrl}/settings?connect=return`
    );

    if (!onboardingUrl) {
      return errorResponse("Failed to create onboarding link", 500);
    }

    return successResponse({ url: onboardingUrl, accountId });
  } catch (error) {
    return handleApiError(error);
  }
}
