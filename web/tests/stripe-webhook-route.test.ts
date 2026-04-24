import test from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { processStripeWebhookEvent } from "../app/api/webhooks/stripe/route";

function asWebhookEvent(event: unknown): Pick<Stripe.Event, "type" | "data"> {
  return event as Pick<Stripe.Event, "type" | "data">;
}

function createSubscription(input: {
  customer: string;
  status: string;
  priceId: string;
  currentPeriodEnd?: number;
  endedAt?: number | null;
  cancelAt?: number | null;
}): Stripe.Subscription {
  return {
    customer: input.customer,
    status: input.status,
    ended_at: input.endedAt ?? null,
    cancel_at: input.cancelAt ?? null,
    items: {
      data: [
        {
          current_period_end: input.currentPeriodEnd ?? 1_778_025_600,
          price: {
            id: input.priceId,
            type: "recurring",
          },
        },
      ],
    },
  } as Stripe.Subscription;
}

test("checkout.session.completed upgrades the user tier using the checkout clerk id", async () => {
  process.env.STRIPE_PRO_PRICE_ID = "price_pro";
  process.env.STRIPE_TEAM_PRICE_ID = "price_team";

  const syncCalls: unknown[] = [];

  await processStripeWebhookEvent(
    asWebhookEvent({
      type: "checkout.session.completed",
      data: {
        object: {
          subscription: "sub_123",
          customer: "cus_123",
          client_reference_id: "clerk_123",
          metadata: {},
        },
      },
    }),
    {
      retrieveSubscription: async () =>
        createSubscription({
          customer: "cus_123",
          status: "active",
          priceId: "price_pro",
          currentPeriodEnd: 1_778_025_600,
        }),
      getUserByStripeCustomerId: async () => null,
      syncSubscriptionState: async (input) => {
        syncCalls.push(input);
      },
    },
  );

  assert.deepEqual(syncCalls, [
    {
      clerkId: "clerk_123",
      stripeCustomerId: "cus_123",
      tier: "pro",
      subscriptionStatus: "active",
      currentPeriodEnd: new Date("2026-05-06T00:00:00.000Z"),
    },
  ]);
});

test("customer.subscription.deleted downgrades a paid customer back to free", async () => {
  process.env.STRIPE_PRO_PRICE_ID = "price_pro";
  process.env.STRIPE_TEAM_PRICE_ID = "price_team";

  const syncCalls: unknown[] = [];

  await processStripeWebhookEvent(
    asWebhookEvent({
      type: "customer.subscription.deleted",
      data: {
        object: createSubscription({
          customer: "cus_team",
          status: "canceled",
          priceId: "price_team",
          endedAt: 1_778_112_000,
        }),
      },
    }),
    {
      retrieveSubscription: async () => {
        throw new Error("should not retrieve subscription for deletion events");
      },
      getUserByStripeCustomerId: async () => null,
      syncSubscriptionState: async (input) => {
        syncCalls.push(input);
      },
    },
  );

  assert.deepEqual(syncCalls, [
    {
      stripeCustomerId: "cus_team",
      tier: "free",
      subscriptionStatus: "canceled",
      currentPeriodEnd: new Date("2026-05-07T00:00:00.000Z"),
    },
  ]);
});

test("invoice.payment_failed preserves the existing user tier when no subscription is attached", async () => {
  const syncCalls: unknown[] = [];

  await processStripeWebhookEvent(
    asWebhookEvent({
      type: "invoice.payment_failed",
      data: {
        object: {
          customer: "cus_existing",
          parent: {
            subscription_details: {
              subscription: null,
            },
          },
        },
      },
    }),
    {
      retrieveSubscription: async () => {
        throw new Error("should not retrieve subscription when invoice has no subscription");
      },
      getUserByStripeCustomerId: async () => ({
        clerk_id: "clerk_existing",
        stripe_customer_id: "cus_existing",
        tier: "team",
      }),
      syncSubscriptionState: async (input) => {
        syncCalls.push(input);
      },
    },
  );

  assert.deepEqual(syncCalls, [
    {
      clerkId: "clerk_existing",
      stripeCustomerId: "cus_existing",
      tier: "team",
      subscriptionStatus: "payment_failed",
      currentPeriodEnd: null,
    },
  ]);
});

test("customer.subscription.updated switches a customer between paid tiers", async () => {
  process.env.STRIPE_PRO_PRICE_ID = "price_pro";
  process.env.STRIPE_TEAM_PRICE_ID = "price_team";

  const syncCalls: unknown[] = [];

  await processStripeWebhookEvent(
    asWebhookEvent({
      type: "customer.subscription.updated",
      data: {
        object: createSubscription({
          customer: "cus_switch",
          status: "active",
          priceId: "price_team",
          currentPeriodEnd: 1_778_198_400,
        }),
      },
    }),
    {
      retrieveSubscription: async () => {
        throw new Error("should not retrieve subscription for subscription.updated events");
      },
      getUserByStripeCustomerId: async () => null,
      syncSubscriptionState: async (input) => {
        syncCalls.push(input);
      },
    },
  );

  assert.deepEqual(syncCalls, [
    {
      stripeCustomerId: "cus_switch",
      tier: "team",
      subscriptionStatus: "active",
      currentPeriodEnd: new Date("2026-05-08T00:00:00.000Z"),
    },
  ]);
});

test("unknown recurring prices fail closed so Stripe retries after config is fixed", async () => {
  process.env.STRIPE_PRO_PRICE_ID = "price_pro";
  process.env.STRIPE_TEAM_PRICE_ID = "price_team";

  let syncCalls = 0;

  await assert.rejects(
    () =>
      processStripeWebhookEvent(
        asWebhookEvent({
          type: "customer.subscription.updated",
          data: {
            object: createSubscription({
              customer: "cus_unknown",
              status: "active",
              priceId: "price_unknown",
            }),
          },
        }),
        {
          retrieveSubscription: async () => {
            throw new Error("should not retrieve subscription for subscription.updated events");
          },
          getUserByStripeCustomerId: async () => null,
          syncSubscriptionState: async () => {
            syncCalls += 1;
          },
        },
      ),
    /Unrecognized Stripe recurring price id: price_unknown/,
  );

  assert.equal(syncCalls, 0);
});

test("subscriptions with multiple recurring items fail closed instead of picking one", async () => {
  process.env.STRIPE_PRO_PRICE_ID = "price_pro";
  process.env.STRIPE_TEAM_PRICE_ID = "price_team";

  let syncCalls = 0;
  const subscription = createSubscription({
    customer: "cus_multi",
    status: "active",
    priceId: "price_pro",
  });
  subscription.items.data.push({
    current_period_end: 1_778_025_600,
    price: {
      id: "price_team",
      type: "recurring",
    },
  } as Stripe.SubscriptionItem);

  await assert.rejects(
    () =>
      processStripeWebhookEvent(
        asWebhookEvent({
          type: "customer.subscription.updated",
          data: { object: subscription },
        }),
        {
          retrieveSubscription: async () => {
            throw new Error("should not retrieve subscription for subscription.updated events");
          },
          getUserByStripeCustomerId: async () => null,
          syncSubscriptionState: async () => {
            syncCalls += 1;
          },
        },
      ),
    /Expected exactly one recurring Stripe subscription item; received 2\./,
  );

  assert.equal(syncCalls, 0);
});
