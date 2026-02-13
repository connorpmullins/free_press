import { requireJournalist } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournalistRevenue } from "@/services/revenue";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/profile/revenue - Journalist revenue summary and entries
export async function GET() {
  try {
    const user = await requireJournalist();
    const profile = await db.journalistProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, stripeConnectId: true },
    });

    if (!profile) {
      return errorResponse("Journalist profile not found", 404);
    }

    const revenue = await getJournalistRevenue(profile.id);

    return successResponse({
      stripeConnectId: profile.stripeConnectId,
      ...revenue,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
