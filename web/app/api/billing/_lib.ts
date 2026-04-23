import "server-only";

import { getStripeServerClient } from "@/lib/billing";
import { isDatabaseConfigured, query } from "@/lib/db";
import type { BillingTier } from "@/lib/limits";

interface BillingUserRow {
  clerk_id: string;
  stripe_customer_id: string | null;
  tier: BillingTier | string;
  subscription_status: string;
}

export class BillingOperationError extends Error {
  code:
    | "db_not_configured"
    | "db_query_failed"
    | "customer_create_failed"
    | "customer_persist_failed";

  constructor(
    code: BillingOperationError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.code = code;
  }
}

export async function ensureBillingUserRow(clerkId: string) {
  if (!isDatabaseConfigured()) {
    throw new BillingOperationError(
      "db_not_configured",
      "Billing requires a configured database.",
    );
  }

  try {
    await query(
      `
        insert into users (
          clerk_id,
          tier,
          subscription_status,
          updated_at
        )
        values ($1, 'free', 'inactive', now())
        on conflict (clerk_id) do nothing
      `,
      [clerkId],
    );
  } catch (error) {
    throw new BillingOperationError(
      "db_query_failed",
      "Unable to create the billing user row.",
      { cause: error },
    );
  }
}

export async function getBillingUser(clerkId: string): Promise<BillingUserRow | null> {
  await ensureBillingUserRow(clerkId);

  try {
    const result = await query<BillingUserRow>(
      `
        select clerk_id, stripe_customer_id, tier, subscription_status
        from users
        where clerk_id = $1
        limit 1
      `,
      [clerkId],
    );

    return result.rows[0] ?? null;
  } catch (error) {
    throw new BillingOperationError(
      "db_query_failed",
      "Unable to load the billing user row.",
      { cause: error },
    );
  }
}

async function persistStripeCustomerId(clerkId: string, stripeCustomerId: string) {
  try {
    await query(
      `
        update users
        set stripe_customer_id = $2,
            updated_at = now()
        where clerk_id = $1
      `,
      [clerkId, stripeCustomerId],
    );
  } catch (error) {
    throw new BillingOperationError(
      "customer_persist_failed",
      "Unable to save the Stripe customer link.",
      { cause: error },
    );
  }
}

export async function getOrCreateStripeCustomerId(clerkId: string): Promise<string> {
  const existing = await getBillingUser(clerkId);
  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  let customerId: string;

  try {
    const customer = await getStripeServerClient().customers.create({
      metadata: {
        clerkId,
      },
    });
    customerId = customer.id;
  } catch (error) {
    throw new BillingOperationError(
      "customer_create_failed",
      "Unable to create the Stripe customer.",
      { cause: error },
    );
  }

  await persistStripeCustomerId(clerkId, customerId);
  return customerId;
}
