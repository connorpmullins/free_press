import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, handleApiError } from "@/lib/api";

// GET /api/admin/stats - Platform statistics
export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      totalJournalists,
      verifiedJournalists,
      totalArticles,
      publishedArticles,
      heldArticles,
      pendingFlags,
      openDisputes,
      activeSubscriptions,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "JOURNALIST" } }),
      db.journalistProfile.count({ where: { verificationStatus: "VERIFIED" } }),
      db.article.count(),
      db.article.count({ where: { status: "PUBLISHED" } }),
      db.article.count({ where: { status: "HELD" } }),
      db.flag.count({ where: { status: "PENDING" } }),
      db.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      db.subscription.count({ where: { status: "ACTIVE" } }),
    ]);

    // Get articles with complete sourcing
    const articlesWithCompleteSourcing = await db.article.count({
      where: { status: "PUBLISHED", sourceComplete: true },
    });

    const sourcingRate =
      publishedArticles > 0
        ? Math.round((articlesWithCompleteSourcing / publishedArticles) * 100)
        : 0;

    return successResponse({
      users: {
        total: totalUsers,
        journalists: totalJournalists,
        verifiedJournalists,
      },
      content: {
        totalArticles,
        published: publishedArticles,
        held: heldArticles,
        sourcingRate,
      },
      moderation: {
        pendingFlags,
        openDisputes,
      },
      revenue: {
        activeSubscriptions,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
