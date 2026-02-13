import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { isStripeEnabled } from "@/lib/stripe";

describe("POST /api/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isStripeEnabled).mockReturnValue(false);
    delete process.env.ALLOW_MOCK_BILLING;
  });

  it("blocks mock billing in production unless explicitly enabled", async () => {
    process.env.NODE_ENV = "production";

    const request = new NextRequest("http://localhost/api/subscribe", {
      method: "POST",
      body: JSON.stringify({ plan: "monthly" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.success).toBe(false);
  });
});
