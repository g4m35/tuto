import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import Stripe from "stripe";

const STRIPE_API_VERSION = "2026-02-25.clover";

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

export function getStripeServerClient(): Stripe {
  if (stripeServerClient) {
    return stripeServerClient;
  }

  stripeServerClient = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"), {
    apiVersion: STRIPE_API_VERSION,
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

export { STRIPE_API_VERSION };
