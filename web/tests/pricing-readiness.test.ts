import test from "node:test";
import assert from "node:assert/strict";

import {
  assertIncludes,
  expectWebFile,
  readWebFile,
} from "./source-test-helpers.ts";

test("pricing route exists and is reachable from the launch UI", () => {
  expectWebFile("app", "pricing", "page.tsx");

  const proxySource = readWebFile("proxy.ts");
  assertIncludes(proxySource, '"/pricing(.*)"', "pricing should remain a public Clerk route");

  const navSource = readWebFile("components", "ui", "TopNav.tsx");
  assertIncludes(navSource, 'href: "/pricing"', "top navigation should expose pricing");
});

test("pricing page wires launch CTAs into checkout and billing portal flows", () => {
  const pageSource = readWebFile("app", "pricing", "page.tsx");
  const clientSource = readWebFile("app", "pricing", "PricingClient.tsx");

  assertIncludes(
    pageSource,
    "<PricingClient />",
    "pricing page should delegate interactive billing controls to the client component",
  );
  assertIncludes(
    clientSource,
    'fetch("/api/billing/checkout"',
    "paid plan CTAs should call the checkout route",
  );
  assertIncludes(
    clientSource,
    "window.location.assign(data.url)",
    "successful checkout starts should redirect the browser to Stripe",
  );
  assertIncludes(
    clientSource,
    'const billing = searchParams.get("billing")',
    "pricing should render explicit checkout status feedback from the billing routes",
  );
  assertIncludes(
    clientSource,
    'if (billing === "success") {',
    "pricing should surface success feedback when returning from Stripe",
  );
  assertIncludes(
    clientSource,
    'if (billing === "canceled") {',
    "pricing should surface cancel feedback when checkout is abandoned",
  );
});

test("usage limit handling still points people at pricing instead of a dead end", () => {
  const limitSource = readWebFile("lib", "withUsageLimit.ts");
  assertIncludes(
    limitSource,
    'upgrade_url: "/pricing"',
    "usage-limit responses should keep the canonical upgrade URL on pricing",
  );

  const createSource = readWebFile("app", "(app)", "create", "page.tsx");
  assertIncludes(
    createSource,
    'if (response.status === 429 && typeof data?.upgrade_url === "string")',
    "the create flow should recognize quota responses with an upgrade URL",
  );
  assertIncludes(
    createSource,
    'upgradeUrl.searchParams.set("reason", "limit")',
    "quota redirects should preserve why the user landed on pricing",
  );
  assertIncludes(
    createSource,
    "router.push(`${upgradeUrl.pathname}${upgradeUrl.search}`)",
    "the create flow should route users to pricing after a limit hit",
  );
});
