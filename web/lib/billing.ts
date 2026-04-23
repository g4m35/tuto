import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import Stripe from "stripe";

let stripeServerClient: Stripe | null = null;
let stripeClientPromise: Promise<StripeJs | null> | null = null;

export type BillingPlan = "pro" | "team";
export type StripeBillingCapability = "checkout" | "portal" | "webhook" | "client";

const STRIPE_ENV_REQUIREMENTS = {
  checkout: [
    "STRIPE_SECRET_KEY",
    "STRIPE_PRO_PRICE_ID",
    "STRIPE_TEAM_PRICE_ID",
  ],
  portal: ["STRIPE_SECRET_KEY"],
  webhook: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  client: ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
} as const satisfies Record<StripeBillingCapability, readonly string[]>;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required Stripe environment variable: ${name}`);
  }

  return value;
}

export function getStripePublishableKey(): string {
  return getRequiredEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}

export function getStripeWebhookSecret(): string {
  return getRequiredEnv("STRIPE_WEBHOOK_SECRET");
}

export function getStripeProPriceId(): string {
  return getRequiredEnv("STRIPE_PRO_PRICE_ID");
}

export function getStripeTeamPriceId(): string {
  return getRequiredEnv("STRIPE_TEAM_PRICE_ID");
}

export function isBillingPlan(value: string): value is BillingPlan {
  return value === "pro" || value === "team";
}

export function getStripePriceIdForPlan(plan: BillingPlan): string {
  if (plan === "team") {
    return getStripeTeamPriceId();
  }

  return getStripeProPriceId();
}

export function getMissingStripeBillingEnv(
  capability: StripeBillingCapability,
): string[] {
  return STRIPE_ENV_REQUIREMENTS[capability].filter((name) => !process.env[name]);
}

export function isStripeBillingConfigured(
  capability: StripeBillingCapability,
): boolean {
  return getMissingStripeBillingEnv(capability).length === 0;
}

export function getSafeBillingReturnUrl(
  returnUrl: string | null | undefined,
  requestUrl: string,
  fallbackPath = "/pricing",
): string {
  const origin = new URL(requestUrl).origin;
  const fallback = new URL(fallbackPath, origin);

  if (!returnUrl) {
    return fallback.toString();
  }

  try {
    const candidate = returnUrl.startsWith("/")
      ? new URL(returnUrl, origin)
      : new URL(returnUrl);
    if (candidate.origin !== origin) {
      return fallback.toString();
    }

    return candidate.toString();
  } catch {
    return fallback.toString();
  }
}

export function getRelativeBillingReturnPath(returnUrl: string): string {
  const candidate = new URL(returnUrl);
  return `${candidate.pathname}${candidate.search}`;
}

export function withBillingStatus(
  returnUrl: string,
  updates: Record<string, string | null | undefined>,
): string {
  const candidate = new URL(returnUrl);

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      candidate.searchParams.delete(key);
      continue;
    }

    candidate.searchParams.set(key, value);
  }

  return candidate.toString();
}

export function getStripeServerClient(): Stripe {
  if (stripeServerClient) {
    return stripeServerClient;
  }

  stripeServerClient = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"), {
    typescript: true,
  });

  return stripeServerClient;
}

export function getStripeClient(): Promise<StripeJs | null> {
  if (stripeClientPromise) {
    return stripeClientPromise;
  }

  stripeClientPromise = loadStripe(getStripePublishableKey());
  return stripeClientPromise;
}
