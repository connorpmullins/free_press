import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError, getIpAddress } from "@/lib/api";
import { createHash } from "crypto";

function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// POST /api/articles/[id]/read - Track a read event (de-duplicated per actor per day)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await db.article.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!article || article.status !== "PUBLISHED") {
      return errorResponse("Article not found", 404);
    }

    const session = await getSession();
    const ip = getIpAddress(request) ?? "unknown";
    const actor = session?.user.id ? `user:${session.user.id}` : `ip:${ip}`;

    const today = new Date().toISOString().slice(0, 10);
    const dedupeKey = hashIdentifier(`${actor}:${id}:${today}`);

    const existing = await db.auditLog.findFirst({
      where: {
        action: "article_read",
        entity: "Article",
        entityId: id,
        details: {
          path: ["dedupeKey"],
          equals: dedupeKey,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      await db.auditLog.create({
        data: {
          userId: session?.user.id,
          action: "article_read",
          entity: "Article",
          entityId: id,
          ipAddress: ip,
          details: {
            dedupeKey,
            day: today,
            actorType: session?.user.id ? "user" : "anonymous",
          },
        },
      });
    }

    return successResponse({ tracked: true });
  } catch (error) {
    return handleApiError(error);
  }
}
