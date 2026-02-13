import Stripe from "stripe";

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

function createStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("STRIPE_SECRET_KEY not set - payment features disabled");
    return null;
  }
  return new Stripe(key, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });
}

export const stripe = globalForStripe.stripe ?? createStripeClient();

if (process.env.NODE_ENV !== "production" && stripe) {
  globalForStripe.stripe = stripe;
}

export function isStripeEnabled(): boolean {
  return stripe !== null;
}

// ============================================================
// Subscription helpers
// ============================================================

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string | null> {
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { source: "free_press" },
    },
  });

  return session.url;
}

export async function createStripeCustomer(
  email: string,
  userId: string
): Promise<string | null> {
  if (!stripe) return null;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  return customer.id;
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<void> {
  if (!stripe) return;

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// ============================================================
// Connect (journalist payouts)
// ============================================================

export async function createConnectAccount(
  email: string,
  journalistId: string
): Promise<string | null> {
  if (!stripe) return null;

  const account = await stripe.accounts.create({
    type: "express",
    email,
    metadata: { journalistId },
    capabilities: {
      transfers: { requested: true },
    },
  });

  return account.id;
}

export async function createConnectOnboardingLink(
  accountId: string,
  returnUrl: string
): Promise<string | null> {
  if (!stripe) return null;

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: returnUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return link.url;
}

export async function createPayout(
  accountId: string,
  amount: number,
  description: string
): Promise<string | null> {
  if (!stripe) return null;

  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: "usd",
    destination: accountId,
    description,
  });

  return transfer.id;
}

export async function getConnectAccountStatus(accountId: string): Promise<{
  id: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
} | null> {
  if (!stripe) return null;

  const account = await stripe.accounts.retrieve(accountId);
  return {
    id: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

// ============================================================
// Identity Verification
// ============================================================

export async function createVerificationSession(
  returnUrl: string
): Promise<{ id: string; url: string } | null> {
  if (!stripe) return null;
  if (process.env.STRIPE_IDENTITY_ENABLED !== "true") return null;

  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    metadata: { source: "free_press_journalist_verification" },
    options: {
      document: {
        require_matching_selfie: true,
      },
    },
    return_url: returnUrl,
  });

  return { id: session.id, url: session.url! };
}

export async function getVerificationSessionStatus(
  sessionId: string
): Promise<string | null> {
  if (!stripe) return null;

  const session =
    await stripe.identity.verificationSessions.retrieve(sessionId);
  return session.status;
}

// ============================================================
// Webhook verification
// ============================================================

export function constructWebhookEvent(
  payload: string,
  signature: string
): Stripe.Event | null {
  if (!stripe) return null;

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return null;

  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return null;
  }
}
