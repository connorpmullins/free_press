import { requireJournalist } from "@/lib/auth";
import { db } from "@/lib/db";
import { createVerificationSession } from "@/lib/stripe";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// POST /api/profile/verification - Start Stripe Identity verification
export async function POST() {
  try {
    const user = await requireJournalist();
    const profile = await db.journalistProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, verificationStatus: true, stripeVerificationId: true },
    });

    if (!profile) {
      return errorResponse("Journalist profile not found", 404);
    }

    if (profile.verificationStatus === "VERIFIED") {
      return errorResponse("Your identity is already verified", 400);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await createVerificationSession(`${appUrl}/settings?verification=return`);

    if (!session) {
      return errorResponse(
        "Identity verification is not configured. Enable Stripe Identity first.",
        503
      );
    }

    await db.journalistProfile.update({
      where: { id: profile.id },
      data: {
        stripeVerificationId: session.id,
        verificationStatus: "PENDING",
      },
    });

    return successResponse({ url: session.url, sessionId: session.id });
  } catch (error) {
    return handleApiError(error);
  }
}
