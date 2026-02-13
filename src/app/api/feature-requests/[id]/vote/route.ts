import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// POST /api/feature-requests/[id]/vote - Toggle vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const featureRequest = await db.featureRequest.findUnique({
      where: { id },
    });

    if (!featureRequest) {
      return errorResponse("Feature request not found", 404);
    }

    const existingVote = await db.vote.findUnique({
      where: { userId_featureRequestId: { userId: user.id, featureRequestId: id } },
    });

    if (existingVote) {
      await db.vote.delete({ where: { id: existingVote.id } });
      return successResponse({ voted: false });
    } else {
      await db.vote.create({
        data: { userId: user.id, featureRequestId: id },
      });
      return successResponse({ voted: true });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
