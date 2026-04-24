import type { BillingTier } from "@/lib/limits";

export function isBillingTier(value: string | null | undefined): value is BillingTier {
  return value === "free" || value === "pro" || value === "team";
}

export function isPaidSubscriptionStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export function getEffectiveBillingTier(
  tier: string | null | undefined,
  subscriptionStatus: string | null | undefined,
): BillingTier {
  if (!tier || !isBillingTier(tier) || tier === "free") {
    return "free";
  }

  return isPaidSubscriptionStatus(subscriptionStatus) ? tier : "free";
}
