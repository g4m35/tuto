import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeServerClient, getStripeWebhookSecret } from "@/lib/billing";

export const runtime = "nodejs";

function formatWebhookError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown Stripe webhook error";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = getStripeServerClient().webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${formatWebhookError(error)}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // TODO: sync subscription state into the app data model.
      break;
    default:
      // Keep foundation handlers tolerant while billing flows are still being wired.
      break;
  }

  return NextResponse.json({ received: true });
}
