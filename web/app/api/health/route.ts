import { NextResponse } from "next/server";
import { isStripeCheckoutConfigured, isStripePortalConfigured } from "@/lib/billing";
import { getDatabaseUrl, isDatabaseConfigured, query } from "@/lib/db";
import { getDeepTutorHealth } from "@/lib/deeptutor-health";
import {
  getLaunchHealthHttpStatus,
  getLaunchHealthStatus,
  type LaunchHealthCheck,
} from "@/lib/launch-health";

export const runtime = "nodejs";

async function getDatabaseCheck(): Promise<LaunchHealthCheck> {
  if (!isDatabaseConfigured()) {
    return {
      name: "database",
      status: "fail",
      summary: "DATABASE_URL or POSTGRES_URL is not configured.",
    };
  }

  try {
    await query("select 1");
    return {
      name: "database",
      status: "pass",
      summary: "Postgres is reachable.",
      details: {
        configured: true,
      },
    };
  } catch (error) {
    return {
      name: "database",
      status: "fail",
      summary: "Postgres is configured but not reachable.",
      details: {
        configured: true,
        error: error instanceof Error ? error.message : "Unknown database error",
      },
    };
  }
}

function getBillingCheck(): LaunchHealthCheck {
  const checkoutConfigured = isStripeCheckoutConfigured();
  const portalConfigured = isStripePortalConfigured();
  const webhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);

  return {
    name: "billing",
    status: checkoutConfigured && portalConfigured && webhookConfigured ? "pass" : "fail",
    summary:
      checkoutConfigured && portalConfigured && webhookConfigured
        ? "Stripe checkout, portal, and webhook secrets are configured."
        : "Stripe production billing configuration is incomplete.",
    details: {
      checkout_configured: checkoutConfigured,
      portal_configured: portalConfigured,
      webhook_configured: webhookConfigured,
    },
  };
}

function getAppUrlCheck(): LaunchHealthCheck {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  return {
    name: "app_url",
    status: appUrl ? "pass" : "warn",
    summary: appUrl
      ? "NEXT_PUBLIC_APP_URL is configured."
      : "NEXT_PUBLIC_APP_URL is unset; redirects rely on request headers.",
  };
}

async function getWebhookEventCheck(): Promise<LaunchHealthCheck> {
  if (!isDatabaseConfigured()) {
    return {
      name: "stripe_webhooks",
      status: "warn",
      summary: "Webhook event health cannot be checked without Postgres.",
    };
  }

  try {
    const tableResult = await query<{ regclass: string | null }>(
      "select to_regclass('public.stripe_webhook_events')::text as regclass",
    );
    const tableExists = Boolean(tableResult.rows[0]?.regclass);

    if (!tableExists) {
      return {
        name: "stripe_webhooks",
        status: "warn",
        summary: "stripe_webhook_events table is missing; apply web migrations.",
      };
    }

    const result = await query<{ failed_count: string }>(
      `
        select count(*)::text as failed_count
        from stripe_webhook_events
        where status = 'failed'
          and updated_at >= now() - interval '24 hours'
      `,
    );
    const failedCount = Number(result.rows[0]?.failed_count ?? "0");

    return {
      name: "stripe_webhooks",
      status: failedCount > 0 ? "warn" : "pass",
      summary:
        failedCount > 0
          ? `${failedCount} Stripe webhook event(s) failed in the last 24 hours.`
          : "No failed Stripe webhook events in the last 24 hours.",
      details: {
        failed_last_24h: failedCount,
      },
    };
  } catch (error) {
    return {
      name: "stripe_webhooks",
      status: "warn",
      summary: "Stripe webhook health could not be queried.",
      details: {
        error: error instanceof Error ? error.message : "Unknown webhook health error",
      },
    };
  }
}

async function getDeepTutorCheck(): Promise<LaunchHealthCheck> {
  const health = await getDeepTutorHealth();
  const fullyConfigured = health.connected && health.llm_configured && health.embeddings_configured;

  return {
    name: "deeptutor",
    status: fullyConfigured ? "pass" : "fail",
    summary: fullyConfigured
      ? "DeepTutor backend is reachable and fully configured."
      : "DeepTutor backend is unreachable or missing model configuration.",
    details: { ...health },
  };
}

export async function GET() {
  const checks = await Promise.all([
    Promise.resolve(getAppUrlCheck()),
    getDatabaseCheck(),
    Promise.resolve(getBillingCheck()),
    getWebhookEventCheck(),
    getDeepTutorCheck(),
  ]);

  const status = getLaunchHealthStatus(checks);

  return NextResponse.json(
    {
      status,
      checked_at: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "unknown",
      database_url_configured: Boolean(getDatabaseUrl()),
      checks,
    },
    {
      status: getLaunchHealthHttpStatus(status),
    },
  );
}
