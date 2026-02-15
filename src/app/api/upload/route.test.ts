import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    requireAuth: vi.fn().mockResolvedValue({
      id: "user-1",
      email: "journalist@example.com",
      role: "JOURNALIST",
    }),
  };
});

vi.mock("@vercel/blob", () => ({
  put: vi.fn().mockResolvedValue({
    url: "https://blob.vercel-storage.com/articles/user-1/test.jpg",
  }),
}));

import { POST } from "./route";

function makeFileRequest(
  file: { name: string; type: string; size: number; content?: string },
) {
  const blob = new Blob([file.content ?? "fake-image-data"], { type: file.type });
  const formData = new FormData();
  formData.append("file", blob, file.name);

  return new NextRequest("http://localhost/api/upload", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL_ENV;
  });

  it("rejects request with no file", async () => {
    const formData = new FormData();
    const request = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("No file");
  });

  it("rejects invalid file type", async () => {
    const request = makeFileRequest({
      name: "script.js",
      type: "application/javascript",
      size: 100,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid file type");
  });

  it("rejects file over 5 MB", async () => {
    // Create a blob that reports the right type but will fail our size check
    // We need to override the size property since FormData blobs
    // don't preserve the original size from our test
    const largeContent = "x".repeat(6 * 1024 * 1024); // 6 MB
    const request = makeFileRequest({
      name: "big.jpg",
      type: "image/jpeg",
      size: 6 * 1024 * 1024,
      content: largeContent,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("too large");
  });

  it("returns 503 when BLOB_READ_WRITE_TOKEN is not set in production deployment", async () => {
    const origEnv = process.env.NODE_ENV;
    const origVercelEnv = process.env.VERCEL_ENV;
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";

    const request = makeFileRequest({
      name: "photo.jpg",
      type: "image/jpeg",
      size: 1000,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain("not configured");

    process.env.NODE_ENV = origEnv;
    process.env.VERCEL_ENV = origVercelEnv;
  });

  it("uses inline fallback when BLOB_READ_WRITE_TOKEN is not set in development", async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const request = makeFileRequest({
      name: "photo.jpg",
      type: "image/jpeg",
      size: 1000,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.url).toContain("data:image/jpeg;base64,");

    process.env.NODE_ENV = origEnv;
  });

  it("uses inline fallback in Vercel preview when token is missing", async () => {
    const origEnv = process.env.NODE_ENV;
    const origVercelEnv = process.env.VERCEL_ENV;
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "preview";

    const request = makeFileRequest({
      name: "photo.jpg",
      type: "image/jpeg",
      size: 1000,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.url).toContain("data:image/jpeg;base64,");

    process.env.NODE_ENV = origEnv;
    process.env.VERCEL_ENV = origVercelEnv;
  });

  it("uploads successfully when configured", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";

    const request = makeFileRequest({
      name: "photo.jpg",
      type: "image/jpeg",
      size: 1000,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.url).toContain("blob.vercel-storage.com");
  });
});
