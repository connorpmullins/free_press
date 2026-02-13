import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constructWebhookEvent } from "@/lib/stripe";
import { auditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const event = constructWebhookEvent(body, signature);
    if (!event) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          customer: string;
          subscription: string;
        };

        await db.subscription.updateMany({
          where: { stripeCustomerId: session.customer },
          data: {
            stripeSubscriptionId: session.subscription,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
          },
        });

        await auditLog({
          action: "subscription_activated",
          entity: "Subscription",
          details: { customerId: session.customer },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown as {
          id: string;
          status: string;
          current_period_start: number;
          current_period_end: number;
        };

        const statusMap: Record<string, string> = {
          active: "ACTIVE",
          past_due: "PAST_DUE",
          canceled: "CANCELED",
          unpaid: "EXPIRED",
        };

        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: (statusMap[subscription.status] || "ACTIVE") as "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED",
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as { id: string };

        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: "CANCELED" },
        });

        await auditLog({
          action: "subscription_canceled",
          entity: "Subscription",
          details: { subscriptionId: subscription.id },
        });
        break;
      }

      case "identity.verification_session.verified": {
        const verificationSession = event.data.object as {
          id: string;
          status: string;
        };

        // Find and update journalist profile
        const profile = await db.journalistProfile.findFirst({
          where: { stripeVerificationId: verificationSession.id },
        });

        if (profile) {
          await db.journalistProfile.update({
            where: { id: profile.id },
            data: { verificationStatus: "VERIFIED" },
          });

          await auditLog({
            userId: profile.userId,
            action: "identity_verified",
            entity: "JournalistProfile",
            entityId: profile.id,
          });
        }
        break;
      }

      case "identity.verification_session.requires_input": {
        const verificationSession = event.data.object as { id: string };

        const profile = await db.journalistProfile.findFirst({
          where: { stripeVerificationId: verificationSession.id },
        });

        if (profile) {
          await db.journalistProfile.update({
            where: { id: profile.id },
            data: { verificationStatus: "FAILED" },
          });
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as {
          id: string;
          payouts_enabled: boolean;
          details_submitted: boolean;
        };

        await auditLog({
          action: "connect_account_updated",
          entity: "JournalistProfile",
          details: {
            accountId: account.id,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
          },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
