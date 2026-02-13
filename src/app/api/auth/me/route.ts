import { getSession } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return errorResponse("Not authenticated", 401);
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        journalistProfile: {
          select: {
            id: true,
            pseudonym: true,
            bio: true,
            beats: true,
            avatarUrl: true,
            verificationStatus: true,
            reputationScore: true,
            articleCount: true,
            totalEarnings: true,
          },
        },
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      journalistProfile: user.journalistProfile,
      subscription: user.subscription,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
