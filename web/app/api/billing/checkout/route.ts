import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getStripeProPriceId,
  getStripeServerClient,
  getStripeTeamPriceId,
} from "@/lib/billing";
import { query } from "@/lib/db";
import type { BillingTier } from "@/lib/limits";

export const runtime = "nodejs";

interface UserBillingRow {
  clerk_id: string;
  stripe_customer_id: string | null;
  tier: BillingTier | string;
}

type CheckoutPlan = "pro" | "team";

function isCheckoutPlan(value: string): value is CheckoutPlan {
  return value === "pro" || value === "team";
}

function isBillingTier(value: string): value is BillingTier {
  return value === "free" || value === "pro" || value === "team";
}

function getPriceIdForPlan(plan: CheckoutPlan) {
  return plan === "team" ? getStripeTeamPriceId() : getStripeProPriceId();
}

function getBaseUrl(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const origin = request.headers.get("origin");
  if (origin) {
    return origin;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

async function ensureUserRow(clerkId: string) {
  await query(
    `
      insert into users (
        clerk_id,
        tier,
        subscription_status,
        updated_at
      )
      values ($1, 'free', 'inactive', now())
      on conflict (clerk_id) do nothing
    `,
    [clerkId],
  );
}

async function getUserBillingRow(clerkId: string): Promise<UserBillingRow | null> {
  await ensureUserRow(clerkId);

  const result = await query<UserBillingRow>(
    `
      select clerk_id, stripe_customer_id, tier
      from users
      where clerk_id = $1
      limit 1
    `,
    [clerkId],
  );

  return result.rows[0] ?? null;
}

async function createOrReuseCustomer(input: {
  clerkId: string;
  email: string | null;
  existingCustomerId: string | null;
}) {
  if (input.existingCustomerId) {
    return input.existingCustomerId;
  }

  const customer = await getStripeServerClient().customers.create({
    email: input.email ?? undefined,
    metadata: {
      clerkId: input.clerkId,
    },
  });

  await query(
    `
      update users
      set stripe_customer_id = $2, updated_at = now()
      where clerk_id = $1
    `,
    [input.clerkId, customer.id],
  );

  return customer.id;
}

export async function POST(request: Request) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const plan = typeof payload === "object" && payload && "plan" in payload ? String(payload.plan) : "";
  if (!isCheckoutPlan(plan)) {
    return NextResponse.json({ error: "Invalid billing plan." }, { status: 400 });
  }

  const user = await getUserBillingRow(userId);
  const currentTier = user?.tier;
  if (currentTier && isBillingTier(currentTier) && currentTier !== "free") {
    return NextResponse.json(
      { error: "You already have an active paid tier. Billing management is the next step." },
      { status: 409 },
    );
  }

  const emailClaim =
    typeof sessionClaims?.email === "string"
      ? sessionClaims.email
      : typeof sessionClaims?.email_address === "string"
        ? sessionClaims.email_address
        : null;

  const stripeCustomerId = await createOrReuseCustomer({
    clerkId: userId,
    email: emailClaim,
    existingCustomerId: user?.stripe_customer_id ?? null,
  });

  const baseUrl = getBaseUrl(request);
  const session = await getStripeServerClient().checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      {
        price: getPriceIdForPlan(plan),
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard?billing=success`,
    cancel_url: `${baseUrl}/pricing?billing=canceled`,
    client_reference_id: userId,
    allow_promotion_codes: true,
    metadata: {
      clerkId: userId,
      plan,
    },
  });

  return NextResponse.json({
    url: session.url,
  });
}
