import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/Button";
import { isDatabaseConfigured, query } from "@/lib/db";
import { BILLING_LIMITS, type BillingTier } from "@/lib/limits";
import { cn } from "@/lib/utils";

interface PricingPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

interface BillingUserRow {
  tier: BillingTier | string;
  subscription_status: string;
  stripe_customer_id: string | null;
  current_period_end: Date | null;
}

interface UsageCountRow {
  event_type: "message" | "doc_upload" | "course_created";
  current: string;
}

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}

function normalizeTier(value: string | null | undefined): BillingTier {
  return value === "pro" || value === "team" ? value : "free";
}

async function getBillingState(clerkId: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const [userResult, usageResult] = await Promise.all([
    query<BillingUserRow>(
      `
        select tier, subscription_status, stripe_customer_id, current_period_end
        from users
        where clerk_id = $1
        limit 1
      `,
      [clerkId],
    ),
    query<UsageCountRow>(
      `
        select event_type::text as event_type, count(*)::text as current
        from usage_events
        where clerk_id = $1
          and created_at >= date_trunc('month', now() at time zone 'utc')
        group by event_type
      `,
      [clerkId],
    ),
  ]);

  const usage = {
    message: 0,
    doc_upload: 0,
    course_created: 0,
  };

  for (const row of usageResult.rows) {
    usage[row.event_type] = Number(row.current);
  }

  return {
    user: userResult.rows[0] ?? null,
    usage,
  };
}

function planSummary(tier: BillingTier) {
  const limits = BILLING_LIMITS[tier];
  return {
    messages:
      limits.messagesPerMonth === null
        ? "Unlimited tutor messages"
        : `${limits.messagesPerMonth} tutor messages / month`,
    docs:
      limits.documents === null ? "Unlimited document uploads" : `${limits.documents} document upload${limits.documents === 1 ? "" : "s"}`,
  };
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const { userId } = await auth();
  const params = searchParams ? await searchParams : {};
  const checkoutState = getSingleParam(params, "checkout");
  const portalState = getSingleParam(params, "portal");
  const reason = getSingleParam(params, "reason");
  const source = getSingleParam(params, "source");
  const billingState = userId ? await getBillingState(userId) : null;
  const currentTier = normalizeTier(billingState?.user?.tier ?? null);
  const subscriptionStatus = billingState?.user?.subscription_status ?? "inactive";
  const periodEnd = billingState?.user?.current_period_end;

  const statusMessage =
    checkoutState === "success"
      ? "Checkout completed. Stripe will update your plan as soon as the webhook lands."
      : checkoutState === "cancelled"
        ? "Checkout was cancelled. Your current plan is unchanged."
        : checkoutState === "unavailable"
          ? `Checkout is not available yet${reason ? `: ${reason.replaceAll("_", " ")}` : ""}.`
          : portalState === "unavailable"
            ? `Billing portal is not available yet${reason ? `: ${reason.replaceAll("_", " ")}` : ""}.`
            : source === "limit"
              ? "You hit a usage limit. Upgrading here will unlock more room for course creation."
              : null;

  const plans: Array<{
    id: BillingTier;
    title: string;
    price: string;
    blurb: string;
  }> = [
    {
      id: "free",
      title: "Free",
      price: "$0",
      blurb: "Try course generation and see whether the workflow fits your study routine.",
    },
    {
      id: "pro",
      title: "Pro",
      price: "$19/mo",
      blurb: "For solo learners who want more uploads, longer iterations, and fewer interruptions.",
    },
    {
      id: "team",
      title: "Team",
      price: "$79/mo",
      blurb: "For coaches, collaborators, or classrooms that need shared headroom.",
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-10 sm:px-8">
      <div className="space-y-3">
        <p className="eyebrow">Pricing</p>
        <h1 className="serif text-5xl font-semibold tracking-tight text-[var(--text)]">
          Launch pricing for course generation.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-[var(--text-dim)]">
          We are keeping the paid launch slice narrow on purpose: courses, uploads,
          account protection, and usage limits. No fake “all features unlocked” promise.
        </p>
      </div>

      {statusMessage ? (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text-dim)]">
          {statusMessage}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const summary = planSummary(plan.id);
            const isCurrentPlan = currentTier === plan.id;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "border-[var(--border)] bg-[var(--bg-elev)] py-0",
                  isCurrentPlan && "ring-2 ring-[color:color-mix(in_srgb,var(--accent)_36%,transparent)]",
                )}
              >
                <CardHeader className="border-b border-[var(--border)] px-6 py-5">
                  <CardTitle className="text-xl text-[var(--text)]">{plan.title}</CardTitle>
                  <CardDescription className="text-[var(--text-dim)]">
                    {plan.blurb}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 px-6 py-6">
                  <div className="text-3xl font-semibold text-[var(--text)]">{plan.price}</div>
                  <div className="space-y-2 text-sm leading-6 text-[var(--text-dim)]">
                    <p>{summary.messages}</p>
                    <p>{summary.docs}</p>
                    <p>Courses remain saved to your account once created.</p>
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-3 border-[var(--border)] bg-[var(--bg-soft)]">
                  {plan.id === "free" ? (
                    <Link
                      href={userId ? "/create" : "/sign-up"}
                      className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
                    >
                      {userId ? "Keep using free" : "Start free"}
                    </Link>
                  ) : userId ? (
                    <form action="/api/billing/checkout" method="post" className="w-full">
                      <input type="hidden" name="plan" value={plan.id} />
                      <input type="hidden" name="returnUrl" value="/pricing" />
                      <input type="hidden" name="successUrl" value="/pricing" />
                      <button
                        type="submit"
                        className={cn(buttonVariants({ size: "lg" }), "w-full")}
                      >
                        {isCurrentPlan ? "Renew or change in Stripe" : `Upgrade to ${plan.title}`}
                      </button>
                    </form>
                  ) : (
                    <Link
                      href="/sign-in?redirect_url=/pricing"
                      className={cn(buttonVariants({ size: "lg" }), "w-full")}
                    >
                      Sign in to upgrade
                    </Link>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </section>

        <aside className="space-y-4">
          <Card className="border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="border-b border-[var(--border)] px-6 py-5">
              <CardTitle className="text-xl text-[var(--text)]">Your account</CardTitle>
              <CardDescription className="text-[var(--text-dim)]">
                {userId
                  ? "Current billing and usage context for this Clerk account."
                  : "Sign in to see your current tier, usage, and billing status."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 px-6 py-6 text-sm text-[var(--text-dim)]">
              <p>Tier: <span className="text-[var(--text)]">{currentTier}</span></p>
              <p>Status: <span className="text-[var(--text)]">{subscriptionStatus}</span></p>
              <p>
                Stripe linked:{" "}
                <span className="text-[var(--text)]">
                  {billingState?.user?.stripe_customer_id ? "yes" : "not yet"}
                </span>
              </p>
              <p>
                Period end:{" "}
                <span className="text-[var(--text)]">
                  {periodEnd ? new Date(periodEnd).toLocaleDateString("en-US") : "n/a"}
                </span>
              </p>
              <p>Messages this month: <span className="text-[var(--text)]">{billingState?.usage.message ?? 0}</span></p>
              <p>Document uploads this month: <span className="text-[var(--text)]">{billingState?.usage.doc_upload ?? 0}</span></p>
              <p>Courses created this month: <span className="text-[var(--text)]">{billingState?.usage.course_created ?? 0}</span></p>
              {!isDatabaseConfigured() ? (
                <p className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                  Billing state is honest but limited here because a hosted Postgres
                  database has not been configured yet.
                </p>
              ) : null}
            </CardContent>
            {userId ? (
              <CardFooter className="border-[var(--border)] bg-[var(--bg-soft)]">
                <form action="/api/billing/portal" method="post" className="w-full">
                  <input type="hidden" name="returnUrl" value="/pricing" />
                  <button
                    type="submit"
                    className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
                  >
                    Manage subscription
                  </button>
                </form>
              </CardFooter>
            ) : null}
          </Card>

          <Card className="border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="border-b border-[var(--border)] px-6 py-5">
              <CardTitle className="text-xl text-[var(--text)]">Support and policy</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-6 py-6 text-sm text-[var(--text-dim)]">
              <p>Support: <Link className="text-[var(--text)] underline" href="/support">support@tuto.app</Link></p>
              <p><Link className="text-[var(--text)] underline" href="/refund-policy">Refund policy</Link></p>
              <p><Link className="text-[var(--text)] underline" href="/terms">Terms</Link></p>
              <p><Link className="text-[var(--text)] underline" href="/privacy">Privacy</Link></p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
