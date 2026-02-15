import { NextRequest } from "next/server";
import { put, del } from "@vercel/blob";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

function assertAuthorized(request: NextRequest): string | null {
  const expected = process.env.SMOKE_TEST_TOKEN;
  if (!expected) return "Smoke test is not configured. Set SMOKE_TEST_TOKEN.";
  const provided = request.headers.get("x-smoke-token");
  if (!provided || provided !== expected) return "Unauthorized";
  return null;
}

// POST /api/system/smoke/upload - Synthetic upload check (upload + delete)
//
// Purpose:
// - validate BLOB_READ_WRITE_TOKEN is working in the deployed environment
// - verify we can upload and delete a test object
//
// Security:
// - locked behind x-smoke-token header (SMOKE_TEST_TOKEN)
export async function POST(request: NextRequest) {
  try {
    const authError = assertAuthorized(request);
    if (authError) return errorResponse(authError, authError === "Unauthorized" ? 401 : 503);

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return errorResponse("Image upload is not configured. Set BLOB_READ_WRITE_TOKEN.", 503);
    }

    const id = crypto.randomUUID();
    const pathname = `smoke/upload/${Date.now()}-${id}.jpg`;

    const body = Buffer.from(`warrant-smoke-upload:${id}`, "utf8");
    const blob = await put(pathname, body, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
    });

    await del(blob.url);

    const res = successResponse({
      ok: true,
      url: blob.url,
      pathname: blob.pathname,
      deleted: true,
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    const res = handleApiError(error);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}

