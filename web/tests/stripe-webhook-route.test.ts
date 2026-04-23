import test from "node:test";

import { assertIncludes, readWebFile } from "./source-test-helpers.ts";

test("stripe webhook route stays on the node runtime and rejects missing signatures", () => {
  const source = readWebFile("app", "api", "webhooks", "stripe", "route.ts");

  assertIncludes(source, 'export const runtime = "nodejs";', "webhook should run on the node runtime");
  assertIncludes(
    source,
    'request.headers.get("stripe-signature")',
    "webhook should read Stripe's signature header",
  );
  assertIncludes(
    source,
    'return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })',
    "webhook should fail fast when Stripe omits the signature header",
  );
});

test("stripe webhook route verifies the payload before touching subscription state", () => {
  const source = readWebFile("app", "api", "webhooks", "stripe", "route.ts");

  assertIncludes(
    source,
    "getStripeServerClient().webhooks.constructEvent(",
    "webhook should verify the signed payload with Stripe before processing it",
  );
  assertIncludes(
    source,
    "getStripeWebhookSecret()",
    "webhook verification should use the configured Stripe signing secret",
  );
  assertIncludes(
    source,
    "Webhook signature verification failed:",
    "invalid signatures should surface a clear 400 error",
  );
});

test("stripe webhook route still covers the paid-launch lifecycle events", () => {
  const source = readWebFile("app", "api", "webhooks", "stripe", "route.ts");

  for (const eventType of [
    '"checkout.session.completed"',
    '"customer.subscription.updated"',
    '"customer.subscription.deleted"',
    '"invoice.payment_failed"',
  ]) {
    assertIncludes(source, `case ${eventType}:`, `webhook should handle ${eventType}`);
  }

  assertIncludes(
    source,
    "return NextResponse.json({ received: true })",
    "recognized and ignored events should still acknowledge receipt to Stripe",
  );
});
