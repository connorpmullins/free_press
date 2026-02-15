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

    // Without BLOB_READ_WRITE_TOKEN: 503 in production, local fallback in dev
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      if (process.env.NODE_ENV === "production") {
        return errorResponse(
          "Image upload is not configured. Set BLOB_READ_WRITE_TOKEN.",
          503
        );
      }

      // Dev fallback: save to public/uploads/ and return a local URL
      const bytes = await file.arrayBuffer();
      const filename = `${Date.now()}-${file.name}`;
      const fs = await import("fs/promises");
      const path = await import("path");
      const dir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, filename), Buffer.from(bytes));
      return successResponse({ url: `/uploads/${filename}` });
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
