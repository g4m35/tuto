export type BillingTier = "free" | "pro" | "team";

export interface TierLimits {
  messagesPerMonth: number | null;
  documents: number | null;
}

export const BILLING_LIMITS = {
  free: {
    messagesPerMonth: 50,
    documents: 1,
  },
  pro: {
    messagesPerMonth: null,
    documents: 10,
  },
  team: {
    messagesPerMonth: null,
    documents: null,
  },
} as const satisfies Record<BillingTier, TierLimits>;

export function getTierLimits(tier: BillingTier): TierLimits {
  return BILLING_LIMITS[tier];
}

export function hasUnlimitedAllowance(limit: number | null): boolean {
  return limit === null;
}
