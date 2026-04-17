import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getStripeProPriceId,
  getStripeServerClient,
  getStripeTeamPriceId,
  getStripeWebhookSecret,
} from "@/lib/billing";
import { query } from "@/lib/db";
import type { BillingTier } from "@/lib/limits";

export const runtime = "nodejs";

interface UserRow {
  clerk_id: string;
  stripe_customer_id: string | null;
  tier: BillingTier;
}

function formatWebhookError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown Stripe webhook error";
}

function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): string | null {
  if (!customer) {
    return null;
  }

  return typeof customer === "string" ? customer : customer.id;
}

function toDate(timestamp: number | null | undefined): Date | null {
  if (typeof timestamp !== "number") {
    return null;
  }

  return new Date(timestamp * 1000);
}

function getClerkIdFromCheckoutSession(session: Stripe.Checkout.Session): string | null {
  const clerkId =
    session.client_reference_id ??
    session.metadata?.clerkId ??
    session.metadata?.clerk_id ??
    session.metadata?.userId ??
    session.metadata?.user_id;

  return clerkId ?? null;
}

function getTierForPriceId(priceId: string | null | undefined): BillingTier {
  if (priceId === getStripeTeamPriceId()) {
    return "team";
  }

  if (priceId === getStripeProPriceId()) {
    return "pro";
  }

  return "free";
}

function getTierForSubscription(subscription: Stripe.Subscription): BillingTier {
  const recurringItem = subscription.items.data.find((item) => item.price.type === "recurring");
  return getTierForPriceId(recurringItem?.price.id);
}

function getCurrentPeriodEndForSubscription(subscription: Stripe.Subscription): Date | null {
  const recurringItem = subscription.items.data.find((item) => item.price.type === "recurring");
  return toDate(recurringItem?.current_period_end);
}

async function getUserByStripeCustomerId(customerId: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `
      select clerk_id, stripe_customer_id, tier
      from users
      where stripe_customer_id = $1
      limit 1
    `,
    [customerId],
  );

  return result.rows[0] ?? null;
}

async function upsertUserSubscriptionState(input: {
  clerkId: string;
  stripeCustomerId: string | null;
  tier: BillingTier;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
}) {
  await query(
    `
      insert into users (
        clerk_id,
        stripe_customer_id,
        tier,
        subscription_status,
        current_period_end,
        updated_at
      )
      values ($1, $2, $3, $4, $5, now())
      on conflict (clerk_id) do update
      set
        stripe_customer_id = coalesce(excluded.stripe_customer_id, users.stripe_customer_id),
        tier = excluded.tier,
        subscription_status = excluded.subscription_status,
        current_period_end = excluded.current_period_end,
        updated_at = now()
    `,
    [
      input.clerkId,
      input.stripeCustomerId,
      input.tier,
      input.subscriptionStatus,
      input.currentPeriodEnd,
    ],
  );
}

async function updateUserSubscriptionStateByCustomerId(input: {
  stripeCustomerId: string;
  tier: BillingTier;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
}) {
  const result = await query<UserRow>(
    `
      update users
      set
        tier = $2,
        subscription_status = $3,
        current_period_end = $4,
        updated_at = now()
      where stripe_customer_id = $1
      returning clerk_id, stripe_customer_id, tier
    `,
    [
      input.stripeCustomerId,
      input.tier,
      input.subscriptionStatus,
      input.currentPeriodEnd,
    ],
  );

  if (result.rowCount === 0) {
    console.warn(
      `Stripe webhook could not find a user row for customer ${input.stripeCustomerId}.`,
    );
  }
}

async function syncSubscriptionState(input: {
  clerkId?: string | null;
  stripeCustomerId: string | null;
  tier: BillingTier;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
}) {
  if (input.clerkId) {
    await upsertUserSubscriptionState({
      clerkId: input.clerkId,
      stripeCustomerId: input.stripeCustomerId,
      tier: input.tier,
      subscriptionStatus: input.subscriptionStatus,
      currentPeriodEnd: input.currentPeriodEnd,
    });
    return;
  }

  if (!input.stripeCustomerId) {
    console.warn("Stripe webhook event did not include a customer id or Clerk id.");
    return;
  }

  await updateUserSubscriptionStateByCustomerId({
    stripeCustomerId: input.stripeCustomerId,
    tier: input.tier,
    subscriptionStatus: input.subscriptionStatus,
    currentPeriodEnd: input.currentPeriodEnd,
  });
}

async function retrieveSubscription(
  subscriptionId: string,
): Promise<Stripe.Response<Stripe.Subscription>> {
  return getStripeServerClient().subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (typeof session.subscription !== "string") {
    console.warn("checkout.session.completed arrived without a subscription id.");
    return;
  }

  const subscription = await retrieveSubscription(session.subscription);
  const existingUser =
    session.customer && typeof session.customer === "string"
      ? await getUserByStripeCustomerId(session.customer)
      : null;

  await syncSubscriptionState({
    clerkId: getClerkIdFromCheckoutSession(session) ?? existingUser?.clerk_id ?? null,
    stripeCustomerId: getCustomerId(session.customer),
    tier: getTierForSubscription(subscription),
    subscriptionStatus: subscription.status,
    currentPeriodEnd: getCurrentPeriodEndForSubscription(subscription),
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await syncSubscriptionState({
    stripeCustomerId: getCustomerId(subscription.customer),
    tier: getTierForSubscription(subscription),
    subscriptionStatus: subscription.status,
    currentPeriodEnd: getCurrentPeriodEndForSubscription(subscription),
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await syncSubscriptionState({
    stripeCustomerId: getCustomerId(subscription.customer),
    tier: "free",
    subscriptionStatus: subscription.status,
    currentPeriodEnd:
      toDate(subscription.ended_at) ??
      toDate(subscription.cancel_at) ??
      getCurrentPeriodEndForSubscription(subscription),
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeCustomerId = getCustomerId(invoice.customer);
  const existingUser = stripeCustomerId ? await getUserByStripeCustomerId(stripeCustomerId) : null;
  const invoiceSubscription = invoice.parent?.subscription_details?.subscription;

  if (typeof invoiceSubscription === "string") {
    const subscription = await retrieveSubscription(invoiceSubscription);

    await syncSubscriptionState({
      clerkId: existingUser?.clerk_id ?? null,
      stripeCustomerId,
      tier: getTierForSubscription(subscription),
      subscriptionStatus: "payment_failed",
      currentPeriodEnd: getCurrentPeriodEndForSubscription(subscription),
    });
    return;
  }

  await syncSubscriptionState({
    clerkId: existingUser?.clerk_id ?? null,
    stripeCustomerId,
    tier: existingUser?.tier ?? "free",
    subscriptionStatus: "payment_failed",
    currentPeriodEnd: null,
  });
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
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
