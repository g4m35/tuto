import test from "node:test";
import assert from "node:assert/strict";
import {
  getEffectiveBillingTier,
  isEnterpriseSubscriptionStatus,
  isPaidSubscriptionStatus,
} from "../lib/billing-status";

test("paid subscription statuses are explicit", () => {
  assert.equal(isPaidSubscriptionStatus("active"), true);
  assert.equal(isPaidSubscriptionStatus("trialing"), true);
  assert.equal(isPaidSubscriptionStatus("past_due"), false);
  assert.equal(isPaidSubscriptionStatus("payment_failed"), false);
  assert.equal(isPaidSubscriptionStatus("canceled"), false);
  assert.equal(isPaidSubscriptionStatus(null), false);
});

test("enterprise subscription statuses are explicit", () => {
  assert.equal(isEnterpriseSubscriptionStatus("active"), true);
  assert.equal(isEnterpriseSubscriptionStatus("trialing"), true);
  assert.equal(isEnterpriseSubscriptionStatus("contracted"), true);
  assert.equal(isEnterpriseSubscriptionStatus("past_due"), false);
  assert.equal(isEnterpriseSubscriptionStatus("payment_failed"), false);
  assert.equal(isEnterpriseSubscriptionStatus("canceled"), false);
  assert.equal(isEnterpriseSubscriptionStatus(null), false);
});

test("effective billing tier falls back to free unless the paid subscription is active", () => {
  assert.equal(getEffectiveBillingTier("pro", "active"), "pro");
  assert.equal(getEffectiveBillingTier("team", "trialing"), "team");
  assert.equal(getEffectiveBillingTier("pro", "past_due"), "free");
  assert.equal(getEffectiveBillingTier("team", "payment_failed"), "free");
  assert.equal(getEffectiveBillingTier("free", "active"), "free");
  assert.equal(getEffectiveBillingTier("enterprise", "active"), "enterprise");
  assert.equal(getEffectiveBillingTier("enterprise", "contracted"), "enterprise");
  assert.equal(getEffectiveBillingTier("enterprise", "payment_failed"), "free");
});
