import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function isProductionDeployment() {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
}

function fileToDataUrl(file: File, bytes: ArrayBuffer) {
  return `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
}

// POST /api/upload - Upload an image to Vercel Blob
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file provided", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(
        `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
        400
      );
    }

    if (file.size > MAX_SIZE) {
      return errorResponse("File too large. Maximum size is 5 MB.", 400);
    }

    // Without BLOB_READ_WRITE_TOKEN:
    // - block only on real production deployments
    // - allow preview/local authoring via inline data URL fallback
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      if (isProductionDeployment()) {
        return errorResponse(
          "Image upload is not configured. Set BLOB_READ_WRITE_TOKEN.",
          503
        );
      }
      const bytes = await file.arrayBuffer();
      return successResponse({ url: fileToDataUrl(file, bytes) });
    }

    const blob = await put(`articles/${user.id}/${Date.now()}-${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });

    return successResponse({ url: blob.url });
  } catch (error) {
    return handleApiError(error);
  }
}
