import "server-only";

import {
  getStripeServerClient,
  isStripeBillingConfigured,
} from "@/lib/billing";
import { isDatabaseConfigured, query } from "@/lib/db";
import type { BillingTier } from "@/lib/limits";

export interface BillingUserRow {
  clerk_id: string;
  stripe_customer_id: string | null;
  tier: BillingTier;
  subscription_status: string;
  current_period_end: Date | null;
}

export type BillingOperationErrorCode =
  | "database_not_configured"
  | "database_query_failed"
  | "stripe_not_configured"
  | "stripe_customer_create_failed"
  | "stripe_customer_persist_failed";

export class BillingOperationError extends Error {
  readonly code: BillingOperationErrorCode;

  constructor(code: BillingOperationErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.code = code;
    this.name = "BillingOperationError";
  }
}

function assertDatabaseConfigured(): void {
  if (!isDatabaseConfigured()) {
    throw new BillingOperationError(
      "database_not_configured",
      "Billing requires a configured database connection.",
    );
  }
}

export async function getBillingUser(clerkId: string): Promise<BillingUserRow | null> {
  assertDatabaseConfigured();

  let result;
  try {
    result = await query<BillingUserRow>(
      `
        select clerk_id, stripe_customer_id, tier, subscription_status, current_period_end
        from users
        where clerk_id = $1
        limit 1
      `,
      [clerkId],
    );
  } catch (error) {
    throw new BillingOperationError(
      "database_query_failed",
      "Unable to read the billing user record.",
      { cause: error },
    );
  }

  return result.rows[0] ?? null;
}

export async function ensureBillingUser(clerkId: string): Promise<BillingUserRow> {
  const existing = await getBillingUser(clerkId);
  if (existing) {
    return existing;
  }

  let inserted;
  try {
    inserted = await query<BillingUserRow>(
      `
        insert into users (clerk_id, tier, subscription_status, updated_at)
        values ($1, 'free', 'inactive', now())
        on conflict (clerk_id) do update
        set updated_at = now()
        returning clerk_id, stripe_customer_id, tier, subscription_status, current_period_end
      `,
      [clerkId],
    );
  } catch (error) {
    throw new BillingOperationError(
      "database_query_failed",
      "Unable to create or update the billing user record.",
      { cause: error },
    );
  }

  return inserted.rows[0];
}

export async function getOrCreateStripeCustomerId(clerkId: string): Promise<string> {
  const billingUser = await ensureBillingUser(clerkId);
  if (billingUser.stripe_customer_id) {
    return billingUser.stripe_customer_id;
  }

  if (!isStripeBillingConfigured("portal")) {
    throw new BillingOperationError(
      "stripe_not_configured",
      "Stripe server configuration is incomplete.",
    );
  }

  let customer;
  try {
    customer = await getStripeServerClient().customers.create({
      metadata: {
        clerkId,
      },
    });
  } catch (error) {
    throw new BillingOperationError(
      "stripe_customer_create_failed",
      "Unable to create a Stripe customer for the authenticated user.",
      { cause: error },
    );
  }

  let updated;
  try {
    updated = await query<{ stripe_customer_id: string | null }>(
      `
        update users
        set stripe_customer_id = $2, updated_at = now()
        where clerk_id = $1 and stripe_customer_id is null
        returning stripe_customer_id
      `,
      [clerkId, customer.id],
    );
  } catch (error) {
    throw new BillingOperationError(
      "database_query_failed",
      "Unable to persist the Stripe customer id.",
      { cause: error },
    );
  }

  if (updated.rowCount && updated.rows[0]?.stripe_customer_id) {
    return updated.rows[0].stripe_customer_id;
  }

  const existing = await getBillingUser(clerkId);
  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  throw new BillingOperationError(
    "stripe_customer_persist_failed",
    "Unable to persist Stripe customer id for the authenticated user.",
  );
}
