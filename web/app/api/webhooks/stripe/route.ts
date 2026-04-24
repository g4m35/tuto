import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getStripeProPriceId,
  getStripeServerClient,
  getStripeTeamPriceId,
  getStripeWebhookSecret,
} from "@/lib/billing";
import { getEffectiveBillingTier } from "@/lib/billing-status";
import { query } from "@/lib/db";
import type { BillingTier } from "@/lib/limits";

export const runtime = "nodejs";

interface UserRow {
  clerk_id: string;
  stripe_customer_id: string | null;
  tier: BillingTier;
}

interface SubscriptionStateInput {
  clerkId?: string | null;
  stripeCustomerId: string | null;
  tier: BillingTier;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
}

interface StripeWebhookDeps {
  retrieveSubscription: (
    subscriptionId: string,
  ) => Promise<Stripe.Response<Stripe.Subscription> | Stripe.Subscription>;
  getUserByStripeCustomerId: (customerId: string) => Promise<UserRow | null>;
  syncSubscriptionState: (input: SubscriptionStateInput) => Promise<void>;
}

class IgnoredStripeWebhookEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IgnoredStripeWebhookEventError";
  }
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

  throw new IgnoredStripeWebhookEventError(
    `Unrecognized Stripe recurring price id: ${priceId ?? "null"}`,
  );
}

function getSingleRecurringSubscriptionItem(subscription: Stripe.Subscription) {
  const recurringItems = subscription.items.data.filter((item) => item.price.type === "recurring");
  if (recurringItems.length !== 1) {
    throw new IgnoredStripeWebhookEventError(
      `Expected exactly one recurring Stripe subscription item; received ${recurringItems.length}.`,
    );
  }

  return recurringItems[0];
}

function getTierForSubscription(subscription: Stripe.Subscription): BillingTier {
  return getTierForPriceId(getSingleRecurringSubscriptionItem(subscription).price.id);
}

function getCurrentPeriodEndForSubscription(subscription: Stripe.Subscription): Date | null {
  return toDate(getSingleRecurringSubscriptionItem(subscription).current_period_end);
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

async function syncSubscriptionState(input: SubscriptionStateInput) {
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

const defaultWebhookDeps: StripeWebhookDeps = {
  retrieveSubscription,
  getUserByStripeCustomerId,
  syncSubscriptionState,
};

async function beginStripeWebhookEvent(event: Stripe.Event): Promise<boolean> {
  const result = await query<{ event_id: string }>(
    `
      insert into stripe_webhook_events (
        event_id,
        event_type,
        stripe_created_at,
        status
      )
      values ($1, $2, $3, 'processing')
      on conflict (event_id) do update
      set status = 'processing',
          error = null,
          attempts = stripe_webhook_events.attempts + 1,
          updated_at = now()
      where stripe_webhook_events.status = 'failed'
      returning event_id
    `,
    [
      event.id,
      event.type,
      typeof event.created === "number" ? new Date(event.created * 1000) : null,
    ],
  );

  return result.rowCount === 1;
}

async function markStripeWebhookEventProcessed(eventId: string, error: string | null = null) {
  await query(
    `
      update stripe_webhook_events
      set status = 'processed',
          error = $2,
          processed_at = now(),
          updated_at = now()
      where event_id = $1
    `,
    [eventId, error],
  );
}

async function markStripeWebhookEventFailed(eventId: string, error: string) {
  await query(
    `
      update stripe_webhook_events
      set status = 'failed',
          error = $2,
          updated_at = now()
      where event_id = $1
    `,
    [eventId, error],
  );
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  deps: StripeWebhookDeps,
) {
  if (typeof session.subscription !== "string") {
    console.warn("checkout.session.completed arrived without a subscription id.");
    return;
  }

  const subscription = await deps.retrieveSubscription(session.subscription);
  const existingUser =
    session.customer && typeof session.customer === "string"
      ? await deps.getUserByStripeCustomerId(session.customer)
      : null;

  const subscriptionStatus = subscription.status;

  await deps.syncSubscriptionState({
    clerkId: getClerkIdFromCheckoutSession(session) ?? existingUser?.clerk_id ?? null,
    stripeCustomerId: getCustomerId(session.customer),
    tier: getEffectiveBillingTier(getTierForSubscription(subscription), subscriptionStatus),
    subscriptionStatus,
    currentPeriodEnd: getCurrentPeriodEndForSubscription(subscription),
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, deps: StripeWebhookDeps) {
  const subscriptionStatus = subscription.status;

  await deps.syncSubscriptionState({
    stripeCustomerId: getCustomerId(subscription.customer),
    tier: getEffectiveBillingTier(getTierForSubscription(subscription), subscriptionStatus),
    subscriptionStatus,
    currentPeriodEnd: getCurrentPeriodEndForSubscription(subscription),
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, deps: StripeWebhookDeps) {
  await deps.syncSubscriptionState({
    stripeCustomerId: getCustomerId(subscription.customer),
    tier: "free",
    subscriptionStatus: subscription.status,
    currentPeriodEnd:
      toDate(subscription.ended_at) ??
      toDate(subscription.cancel_at) ??
      getCurrentPeriodEndForSubscription(subscription),
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, deps: StripeWebhookDeps) {
  const stripeCustomerId = getCustomerId(invoice.customer);
  const existingUser = stripeCustomerId
    ? await deps.getUserByStripeCustomerId(stripeCustomerId)
    : null;
  const invoiceSubscription = invoice.parent?.subscription_details?.subscription;

  if (typeof invoiceSubscription === "string") {
    const subscription = await deps.retrieveSubscription(invoiceSubscription);

    await deps.syncSubscriptionState({
      clerkId: existingUser?.clerk_id ?? null,
      stripeCustomerId,
      tier: "free",
      subscriptionStatus: "payment_failed",
      currentPeriodEnd: getCurrentPeriodEndForSubscription(subscription),
    });
    return;
  }

  await deps.syncSubscriptionState({
    clerkId: existingUser?.clerk_id ?? null,
    stripeCustomerId,
    tier: "free",
    subscriptionStatus: "payment_failed",
    currentPeriodEnd: null,
  });
}

export async function processStripeWebhookEvent(
  event: Pick<Stripe.Event, "type" | "data">,
  deps: StripeWebhookDeps = defaultWebhookDeps,
) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, deps);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, deps);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, deps);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, deps);
      break;
    default:
      break;
  }
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

  try {
    const shouldProcess = await beginStripeWebhookEvent(event);
    if (!shouldProcess) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await processStripeWebhookEvent(event);
    await markStripeWebhookEventProcessed(event.id);
  } catch (error) {
    await markStripeWebhookEventFailed(event.id, formatWebhookError(error)).catch(() => undefined);
    return NextResponse.json(
      { error: `Webhook processing failed: ${formatWebhookError(error)}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
