import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getRequestOrigin,
  getStripePriceIdForPlan,
  getStripeServerClient,
  isBillingPlan,
  isStripeCheckoutConfigured,
  toSafeRelativePath,
  withBillingStatus,
} from "@/lib/billing";
import { BillingOperationError, getOrCreateStripeCustomerId } from "@/app/api/billing/_lib";

export const runtime = "nodejs";

function redirectToSignIn(request: Request) {
  const origin = getRequestOrigin(request.url);
  const target = toSafeRelativePath("/pricing");
  const url = new URL("/sign-in", origin);
  url.searchParams.set("redirect_url", target);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return redirectToSignIn(request);
  }

  const formData = await request.formData();
  const plan = String(formData.get("plan") || "");
  const returnPath = toSafeRelativePath(formData.get("returnUrl"), "/pricing");
  const successPath = toSafeRelativePath(formData.get("successUrl"), "/pricing");
  const origin = getRequestOrigin(request.url);

  if (!isBillingPlan(plan)) {
    return NextResponse.redirect(
      new URL(
        withBillingStatus(returnPath, { checkout: "invalid_plan" }),
        origin,
      ),
    );
  }

  if (!isStripeCheckoutConfigured()) {
    return NextResponse.redirect(
      new URL(
        withBillingStatus(returnPath, {
          checkout: "unavailable",
          reason: "stripe_not_configured",
        }),
        origin,
      ),
    );
  }

  try {
    const stripeCustomerId = await getOrCreateStripeCustomerId(userId);
    const session = await getStripeServerClient().checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: userId,
      allow_promotion_codes: true,
      line_items: [
        {
          price: getStripePriceIdForPlan(plan),
          quantity: 1,
        },
      ],
      metadata: {
        clerkId: userId,
        plan,
      },
      success_url: `${origin}${withBillingStatus(successPath, {
        checkout: "success",
        plan,
      })}`,
      cancel_url: `${origin}${withBillingStatus(returnPath, {
        checkout: "cancelled",
        plan,
      })}`,
    });

    if (!session.url) {
      throw new Error("Stripe Checkout did not return a redirect URL.");
    }

    return NextResponse.redirect(session.url);
  } catch (error) {
    const reason =
      error instanceof BillingOperationError ? error.code : "checkout_failed";

    return NextResponse.redirect(
      new URL(
        withBillingStatus(returnPath, {
          checkout: "unavailable",
          reason,
          plan,
        }),
        origin,
      ),
    );
  }
}
