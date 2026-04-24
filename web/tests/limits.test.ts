import assert from "node:assert/strict";
import test from "node:test";
import { getTierLimits, hasUnlimitedAllowance } from "../lib/limits";

test("launch billing tiers expose expected message and document quotas", () => {
  assert.deepEqual(getTierLimits("free"), {
    messagesPerMonth: 50,
    documents: 1,
  });

  assert.deepEqual(getTierLimits("pro"), {
    messagesPerMonth: null,
    documents: 10,
  });

  assert.deepEqual(getTierLimits("team"), {
    messagesPerMonth: null,
    documents: null,
  });
});

test("null limits are treated as unlimited allowance", () => {
  assert.equal(hasUnlimitedAllowance(null), true);
  assert.equal(hasUnlimitedAllowance(0), false);
  assert.equal(hasUnlimitedAllowance(10), false);
});
