import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api";
import { getFeed, getChronologicalFeed } from "@/services/distribution";

// GET /api/feed - Get ranked feed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const sort = searchParams.get("sort") || "ranked"; // "ranked" or "chronological"
    const authorId = searchParams.get("authorId") || undefined;
    const offset = (page - 1) * limit;

    const result =
      sort === "chronological"
        ? await getChronologicalFeed({ limit, offset })
        : await getFeed({ limit, offset, authorId });

    return successResponse({
      articles: result.articles,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
      sort,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
