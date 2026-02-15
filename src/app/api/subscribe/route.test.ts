import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrismaClient } from "@/test/setup";

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    requireAuth: vi.fn().mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      role: "READER",
    }),
  };
});

vi.mock("@/lib/stripe", () => ({
  isStripeEnabled: vi.fn(),
  createStripeCustomer: vi.fn(),
  createCheckoutSession: vi.fn(),
}));

import { POST } from "./route";
import {
  isStripeEnabled,
  createCheckoutSession,
  createStripeCustomer,
} from "@/lib/stripe";

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

  it("recreates stale Stripe customer and retries checkout", async () => {
    vi.mocked(isStripeEnabled).mockReturnValue(true);
    process.env.STRIPE_MONTHLY_PRICE_ID = "price_monthly_123";
    process.env.STRIPE_ANNUAL_PRICE_ID = "price_annual_123";

    mockPrismaClient.subscription.findUnique.mockResolvedValueOnce({
      userId: "user-1",
      stripeCustomerId: "cus_stale",
      plan: "MONTHLY",
      status: "EXPIRED",
    });

    const staleCustomerError = Object.assign(
      new Error("No such customer: 'cus_stale'"),
      {
        code: "resource_missing",
        param: "customer",
      }
    );
    vi.mocked(createCheckoutSession)
      .mockRejectedValueOnce(staleCustomerError)
      .mockResolvedValueOnce("https://checkout.stripe.test/session");
    vi.mocked(createStripeCustomer).mockResolvedValueOnce("cus_replacement");

    const request = new NextRequest("http://localhost/api/subscribe", {
      method: "POST",
      body: JSON.stringify({ plan: "monthly" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.url).toContain("checkout.stripe.test");
    expect(vi.mocked(createStripeCustomer)).toHaveBeenCalledWith(
      "user@example.com",
      "user-1"
    );
    expect(mockPrismaClient.subscription.update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { stripeCustomerId: "cus_replacement" },
    });
  });
});
