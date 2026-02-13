import { NextRequest } from "next/server";
import { requireAuth, getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createFeatureRequestSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/feature-requests - List feature requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || "ALL";
    const sort = searchParams.get("sort") || "votes";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;
    const session = await getSession();

    const where: Record<string, unknown> = {};
    if (status !== "ALL") where.status = status;

    const orderBy =
      sort === "newest"
        ? { createdAt: "desc" as const }
        : undefined; // Will sort by vote count manually for "votes"

    const [requests, total] = await Promise.all([
      db.featureRequest.findMany({
        where,
        include: {
          user: { select: { displayName: true } },
          _count: { select: { votes: true } },
          votes: session?.user
            ? { where: { userId: session.user.id }, select: { id: true } }
            : false,
        },
        orderBy: orderBy || { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      db.featureRequest.count({ where }),
    ]);

    let sortedRequests = requests.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      decisionLog: r.decisionLog,
      createdAt: r.createdAt,
      author: r.user.displayName,
      voteCount: r._count.votes,
      hasVoted: Array.isArray(r.votes) ? r.votes.length > 0 : false,
    }));

    if (sort === "votes") {
      sortedRequests = sortedRequests.sort((a, b) => b.voteCount - a.voteCount);
    }

    return successResponse({
      requests: sortedRequests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/feature-requests - Create feature request
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = createFeatureRequestSchema.parse(body);

    const featureRequest = await db.featureRequest.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description,
      },
    });

    return successResponse({ featureRequest: { id: featureRequest.id } }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
