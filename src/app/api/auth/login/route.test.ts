import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// These are already mocked in setup.ts
import { createMagicLink } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/redis";

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    createMagicLink: vi.fn().mockResolvedValue("mock-token-abc123"),
  };
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 5,
      resetAt: Math.floor(Date.now() / 1000) + 900,
    });
  });

  it("sends magic link email for valid email", async () => {
    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe("Check your email for a sign-in link");
    expect(createMagicLink).toHaveBeenCalledWith("user@example.com");
    expect(sendMagicLinkEmail).toHaveBeenCalledWith(
      "user@example.com",
      "mock-token-abc123"
    );
  });

  it("rejects invalid email with 400", async () => {
    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(createMagicLink).not.toHaveBeenCalled();
  });

  it("still returns success when rate limited (doesn't reveal rate limiting)", async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Math.floor(Date.now() / 1000) + 900,
    });

    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe("Check your email for a sign-in link");
    // Should NOT have actually created a magic link
    expect(createMagicLink).not.toHaveBeenCalled();
  });
});
