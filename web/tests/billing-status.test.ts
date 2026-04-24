import test from "node:test";
import assert from "node:assert/strict";
import { getEffectiveBillingTier, isPaidSubscriptionStatus } from "../lib/billing-status";

test("paid subscription statuses are explicit", () => {
  assert.equal(isPaidSubscriptionStatus("active"), true);
  assert.equal(isPaidSubscriptionStatus("trialing"), true);
  assert.equal(isPaidSubscriptionStatus("past_due"), false);
  assert.equal(isPaidSubscriptionStatus("payment_failed"), false);
  assert.equal(isPaidSubscriptionStatus("canceled"), false);
  assert.equal(isPaidSubscriptionStatus(null), false);
});

test("effective billing tier falls back to free unless the paid subscription is active", () => {
  assert.equal(getEffectiveBillingTier("pro", "active"), "pro");
  assert.equal(getEffectiveBillingTier("team", "trialing"), "team");
  assert.equal(getEffectiveBillingTier("pro", "past_due"), "free");
  assert.equal(getEffectiveBillingTier("team", "payment_failed"), "free");
  assert.equal(getEffectiveBillingTier("free", "active"), "free");
  assert.equal(getEffectiveBillingTier("enterprise", "active"), "free");
});
