import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getRelativeBillingReturnPath,
  getSafeBillingReturnUrl,
  getStripeServerClient,
  isStripeBillingConfigured,
  withBillingStatus,
} from "@/lib/billing";
import { BillingOperationError, getBillingUser } from "@/app/api/billing/_lib";

export const runtime = "nodejs";

function getSignInRedirect(requestUrl: string, returnUrl: string): NextResponse {
  const signInUrl = new URL("/sign-in", requestUrl);
  signInUrl.searchParams.set("redirect_url", getRelativeBillingReturnPath(returnUrl));
  return NextResponse.redirect(signInUrl, 303);
}

function redirectToPortalStatus(
  returnUrl: string,
  updates: Record<string, string | null | undefined>,
): NextResponse {
  return NextResponse.redirect(withBillingStatus(returnUrl, updates), 303);
}

function getPortalFailureReason(error: unknown): string {
  if (!(error instanceof BillingOperationError)) {
    return "temporarily_unavailable";
  }

  switch (error.code) {
    case "database_not_configured":
      return "database_not_configured";
    case "stripe_not_configured":
      return "stripe_not_configured";
    case "database_query_failed":
      return "lookup_failed";
    case "stripe_customer_create_failed":
    case "stripe_customer_persist_failed":
      return "setup_failed";
    default:
      return "temporarily_unavailable";
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  const formData = await request.formData();

  const returnUrl = getSafeBillingReturnUrl(
    String(formData.get("returnUrl") || ""),
    request.url,
    "/pricing",
  );

  if (!userId) {
    return getSignInRedirect(request.url, returnUrl);
  }

  if (!isStripeBillingConfigured("portal")) {
    return redirectToPortalStatus(returnUrl, {
      portal: "unavailable",
      reason: "stripe_not_configured",
    });
  }

  try {
    const billingUser = await getBillingUser(userId);
    if (!billingUser?.stripe_customer_id) {
      return redirectToPortalStatus(returnUrl, {
        portal: "unavailable",
        reason: "customer_missing",
      });
    }

    const session = await getStripeServerClient().billingPortal.sessions.create({
      customer: billingUser.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    return redirectToPortalStatus(returnUrl, {
      portal: "unavailable",
      reason: getPortalFailureReason(error),
    });
  }
}
