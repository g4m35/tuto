import test from "node:test";

import { assertIncludes, readWebFile } from "./source-test-helpers.ts";

test("checkout route requires auth, validates plans, and creates subscription checkout sessions", () => {
  const source = readWebFile("app", "api", "billing", "checkout", "route.ts");

  assertIncludes(source, "const { userId, sessionClaims } = await auth()", "checkout should require Clerk auth");
  assertIncludes(
    source,
    'if (!userId) {',
    "unauthenticated checkout requests should fail closed",
  );
  assertIncludes(source, 'return NextResponse.json({ error: "unauthorized" }, { status: 401 });', "checkout should return 401 when auth is missing");
  assertIncludes(source, "if (!isCheckoutPlan(plan))", "checkout should reject unknown plans");
  assertIncludes(
    source,
    "const stripeCustomerId = await createOrReuseCustomer({",
    "checkout should resolve the Stripe customer server-side",
  );
  assertIncludes(
    source,
    "allow_promotion_codes: true",
    "checkout should keep promotion codes available for launch offers",
  );
  assertIncludes(
    source,
    "mode: \"subscription\"",
    "checkout should create a subscription session for paid tiers",
  );
  assertIncludes(
    source,
    "if (currentTier && isBillingTier(currentTier) && currentTier !== \"free\")",
    "checkout should prevent creating duplicate paid subscriptions",
  );
});

test("portal route requires auth and never accepts a client-supplied Stripe customer id", () => {
  const source = readWebFile("app", "api", "billing", "portal", "route.ts");

  assertIncludes(source, "const { userId } = await auth()", "portal should require Clerk auth");
  assertIncludes(
    source,
    "const billingUser = await getBillingUser(userId)",
    "portal should look up the Stripe customer from the authenticated user record",
  );
  assertIncludes(
    source,
    "customer: billingUser.stripe_customer_id",
    "portal should create sessions from the stored Stripe customer id",
  );
  assertIncludes(
    source,
    "if (!billingUser?.stripe_customer_id)",
    "portal should fail closed when no Stripe customer is linked yet",
  );
  assertIncludes(
    source,
    "getSafeBillingReturnUrl(",
    "portal should sanitize its return destination before redirecting off-site",
  );
});

test("billing helper routes centralize customer lookup and persistence on the server", () => {
  const source = readWebFile("app", "api", "billing", "_lib.ts");

  assertIncludes(source, 'import "server-only";', "billing helper module should stay server-only");
  assertIncludes(
    source,
    "export async function getOrCreateStripeCustomerId(clerkId: string)",
    "billing helper should own server-side Stripe customer resolution",
  );
  assertIncludes(
    source,
    "customers.create({",
    "billing helper should create a Stripe customer when one does not exist",
  );
  assertIncludes(
    source,
    "where clerk_id = $1 and stripe_customer_id is null",
    "customer persistence should avoid overwriting an existing Stripe customer id",
  );
});
