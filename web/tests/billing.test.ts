import test from "node:test";
import assert from "node:assert/strict";

import {
  getSafeBillingReturnUrl,
  getStripePriceIdForPlan,
  isBillingPlan,
} from "../lib/billing.ts";

test("isBillingPlan accepts only paid plans", () => {
  assert.equal(isBillingPlan("pro"), true);
  assert.equal(isBillingPlan("team"), true);
  assert.equal(isBillingPlan("free"), false);
  assert.equal(isBillingPlan("enterprise"), false);
});

test("getStripePriceIdForPlan maps plans to the configured Stripe price ids", () => {
  process.env.STRIPE_PRO_PRICE_ID = "price_pro_launch";
  process.env.STRIPE_TEAM_PRICE_ID = "price_team_launch";

  assert.equal(getStripePriceIdForPlan("pro"), "price_pro_launch");
  assert.equal(getStripePriceIdForPlan("team"), "price_team_launch");
});

test("getSafeBillingReturnUrl keeps same-origin paths and strips external redirects", () => {
  const requestUrl = "https://app.tuto.example/api/billing/checkout";

  assert.equal(
    getSafeBillingReturnUrl("/pricing?reason=limit", requestUrl),
    "https://app.tuto.example/pricing?reason=limit",
  );

  assert.equal(
    getSafeBillingReturnUrl("https://evil.example/phish", requestUrl),
    "https://app.tuto.example/pricing",
  );

  assert.equal(
    getSafeBillingReturnUrl("not a url", requestUrl),
    "https://app.tuto.example/pricing",
  );
});

test("getSafeBillingReturnUrl preserves same-origin absolute URLs and defaults on empty input", () => {
  const requestUrl = "https://app.tuto.example/api/billing/portal";

  assert.equal(
    getSafeBillingReturnUrl("https://app.tuto.example/settings/billing", requestUrl),
    "https://app.tuto.example/settings/billing",
  );

  assert.equal(
    getSafeBillingReturnUrl(undefined, requestUrl, "/dashboard"),
    "https://app.tuto.example/dashboard",
  );
});

test("getStripePriceIdForPlan throws when a required Stripe price id is missing", () => {
  const originalPro = process.env.STRIPE_PRO_PRICE_ID;
  delete process.env.STRIPE_PRO_PRICE_ID;

  assert.throws(
    () => getStripePriceIdForPlan("pro"),
    /Missing required Stripe environment variable: STRIPE_PRO_PRICE_ID/,
  );

  process.env.STRIPE_PRO_PRICE_ID = originalPro;
});
