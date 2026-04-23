import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import Stripe from "stripe";
import type { BillingTier } from "@/lib/limits";

let stripeServerClient: Stripe | null = null;
let stripeClientPromise: Promise<StripeJs | null> | null = null;

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

export type BillingPlan = Exclude<BillingTier, "free">;

export function isBillingPlan(value: string): value is BillingPlan {
  return value === "pro" || value === "team";
}

export function getStripePriceIdForPlan(plan: BillingPlan): string {
  return plan === "team" ? getStripeTeamPriceId() : getStripeProPriceId();
}

function hasEnv(name: string): boolean {
  return Boolean(process.env[name]);
}

export function isStripeCheckoutConfigured(): boolean {
  return hasEnv("STRIPE_SECRET_KEY") && hasEnv("STRIPE_PRO_PRICE_ID") && hasEnv("STRIPE_TEAM_PRICE_ID");
}

export function isStripePortalConfigured(): boolean {
  return hasEnv("STRIPE_SECRET_KEY");
}

export function getRequestOrigin(requestUrl: string): string {
  return new URL(requestUrl).origin;
}

export function toSafeRelativePath(
  value: FormDataEntryValue | string | null | undefined,
  fallback = "/pricing",
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }

  try {
    if (value.startsWith("/") && !value.startsWith("//")) {
      const url = new URL(value, "https://tuto.local");
      return `${url.pathname}${url.search}${url.hash}`;
    }

    const url = new URL(value);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function withBillingStatus(
  path: string,
  params: Record<string, string | number | null | undefined>,
): string {
  const url = new URL(path, "https://tuto.local");

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return `${url.pathname}${url.search}${url.hash}`;
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
