import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createFlagSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/redis";

// POST /api/flags - Create a flag
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = createFlagSchema.parse(body);

    // Rate limit: 10 flags per hour per user
    const rateLimit = await checkRateLimit(`flag:${user.id}`, 10, 3600);
    if (!rateLimit.allowed) {
      return errorResponse("Too many flags. Please try again later.", 429);
    }

    // Check article exists and is published
    const article = await db.article.findUnique({
      where: { id: data.articleId },
    });

    if (!article || article.status !== "PUBLISHED") {
      return errorResponse("Article not found", 404);
    }

    // Check for duplicate flag
    const existingFlag = await db.flag.findFirst({
      where: {
        articleId: data.articleId,
        reporterId: user.id,
        status: "PENDING",
      },
    });

    if (existingFlag) {
      return errorResponse("You already have a pending flag on this article", 400);
    }

    const flag = await db.flag.create({
      data: {
        articleId: data.articleId,
        reporterId: user.id,
        reason: data.reason,
        details: data.details,
      },
    });

    await auditLog({
      userId: user.id,
      action: "flag_created",
      entity: "Flag",
      entityId: flag.id,
      details: { articleId: data.articleId, reason: data.reason },
    });

    return successResponse({ flag: { id: flag.id } }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
