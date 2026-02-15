import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({
  createMagicLink: vi.fn().mockResolvedValue("test-token"),
}));

describe("POST /api/auth/login/test", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDevFlag = process.env.ENABLE_DEV_LOGIN;
  const originalVercelEnv = process.env.VERCEL_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.ENABLE_DEV_LOGIN = originalDevFlag;
    process.env.VERCEL_ENV = originalVercelEnv;
  });

  it("returns 404 when dev login flag is disabled", async () => {
    process.env.NODE_ENV = "development";
    process.env.ENABLE_DEV_LOGIN = "false";

    const request = new NextRequest("http://localhost/api/auth/login/test", {
      method: "POST",
      body: JSON.stringify({ email: "reader@example.com" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it("returns 404 in Vercel production regardless of flag", async () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.ENABLE_DEV_LOGIN = "true";

    const request = new NextRequest("http://localhost/api/auth/login/test", {
      method: "POST",
      body: JSON.stringify({ email: "reader@example.com" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("returns token when explicitly enabled in non-production", async () => {
    process.env.NODE_ENV = "development";
    process.env.ENABLE_DEV_LOGIN = "true";

    const request = new NextRequest("http://localhost/api/auth/login/test", {
      method: "POST",
      body: JSON.stringify({ email: "reader@example.com" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.token).toBe("test-token");
  });

  it("returns token in Vercel preview when explicitly enabled", async () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "preview";
    process.env.ENABLE_DEV_LOGIN = "true";

    const request = new NextRequest("http://localhost/api/auth/login/test", {
      method: "POST",
      body: JSON.stringify({ email: "reader@example.com" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.token).toBe("test-token");
  });
});
