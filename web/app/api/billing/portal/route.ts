import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getRequestOrigin,
  getStripeServerClient,
  isStripePortalConfigured,
  toSafeRelativePath,
  withBillingStatus,
} from "@/lib/billing";
import { BillingOperationError, getBillingUser } from "@/app/api/billing/_lib";

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
  const returnPath = toSafeRelativePath(formData.get("returnUrl"), "/pricing");
  const origin = getRequestOrigin(request.url);

  if (!isStripePortalConfigured()) {
    return NextResponse.redirect(
      new URL(
        withBillingStatus(returnPath, {
          portal: "unavailable",
          reason: "stripe_not_configured",
        }),
        origin,
      ),
    );
  }

  try {
    const user = await getBillingUser(userId);
    if (!user?.stripe_customer_id) {
      return NextResponse.redirect(
        new URL(
          withBillingStatus(returnPath, {
            portal: "unavailable",
            reason: "no_customer",
          }),
          origin,
        ),
      );
    }

    const session = await getStripeServerClient().billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${origin}${returnPath}`,
    });

    return NextResponse.redirect(session.url);
  } catch (error) {
    const reason = error instanceof BillingOperationError ? error.code : "portal_failed";

    return NextResponse.redirect(
      new URL(
        withBillingStatus(returnPath, {
          portal: "unavailable",
          reason,
        }),
        origin,
      ),
    );
  }
}
