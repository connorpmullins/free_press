import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSubscriptionSchema } from "@/lib/validations";
import {
  isStripeEnabled,
  createStripeCustomer,
  createCheckoutSession,
} from "@/lib/stripe";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

function isMissingStripeCustomerError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const maybeStripeError = error as Error & {
    code?: string;
    param?: string;
  };

  return (
    maybeStripeError.code === "resource_missing" &&
    maybeStripeError.param === "customer"
  );
}

// POST /api/subscribe - Create checkout session
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { plan } = createSubscriptionSchema.parse(body);

    const allowMockBilling = process.env.ALLOW_MOCK_BILLING === "true";
    if (!isStripeEnabled()) {
      if (process.env.NODE_ENV === "production" && !allowMockBilling) {
        return errorResponse("Billing is temporarily unavailable", 503);
      }

      // Mock mode: create subscription directly
      await db.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          plan: plan === "annual" ? "ANNUAL" : "MONTHLY",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            Date.now() +
              (plan === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000
          ),
        },
        update: {
          plan: plan === "annual" ? "ANNUAL" : "MONTHLY",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            Date.now() +
              (plan === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000
          ),
        },
      });

      return successResponse({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/success`,
        mock: true,
      });
    }

    // Get or create Stripe customer
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      customerId = await createStripeCustomer(user.email, user.id);
      if (!customerId) {
        return errorResponse("Failed to create payment customer", 500);
      }
    }

    // Get the correct price ID
    const priceId =
      plan === "annual"
        ? process.env.STRIPE_ANNUAL_PRICE_ID
        : process.env.STRIPE_MONTHLY_PRICE_ID;

    if (!priceId) {
      return errorResponse("Subscription plan not configured", 500);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${appUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/subscribe`;

    let checkoutUrl: string | null = null;

    try {
      checkoutUrl = await createCheckoutSession(
        customerId,
        priceId,
        successUrl,
        cancelUrl
      );
    } catch (error) {
      // A lapsed subscription may retain a stale Stripe customer ID.
      // Recreate the customer once and retry checkout.
      if (!isMissingStripeCustomerError(error)) throw error;

      const replacementCustomerId = await createStripeCustomer(
        user.email,
        user.id
      );
      if (!replacementCustomerId) {
        return errorResponse("Failed to create payment customer", 500);
      }

      customerId = replacementCustomerId;
      checkoutUrl = await createCheckoutSession(
        customerId,
        priceId,
        successUrl,
        cancelUrl
      );
    }

    if (!checkoutUrl) {
      return errorResponse("Failed to create checkout session", 500);
    }

    // Save customer ID
    if (!subscription) {
      await db.subscription.create({
        data: {
          userId: user.id,
          stripeCustomerId: customerId,
          plan: plan === "annual" ? "ANNUAL" : "MONTHLY",
          status: "EXPIRED", // Will be activated by webhook
        },
      });
    } else if (subscription.stripeCustomerId !== customerId) {
      await db.subscription.update({
        where: { userId: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    return successResponse({ url: checkoutUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
