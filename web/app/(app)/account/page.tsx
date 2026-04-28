import { auth, currentUser } from "@clerk/nextjs/server";
import { CreditCard, Gauge, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { AccountBillingActions } from "@/components/account/AccountBillingActions";
import { isStripeCheckoutConfigured, isStripePortalConfigured } from "@/lib/billing";
import { getBillingSummary } from "@/lib/billing-server";
import { getTierLimits, hasUnlimitedAllowance, type BillingTier } from "@/lib/limits";
import { checkLimit, type UsageEventType, type UsageSnapshot } from "@/lib/usage";

type UsageLine = {
  key: UsageEventType;
  label: string;
  current: number | null;
  limit: number | null;
  resetsAt: string | null;
  available: boolean;
};

const planLabels: Record<BillingTier, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="t-eyebrow">
      <span className="t-eyebrow__rule" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatLimit(current: number | null, limit: number | null) {
  if (limit === null) return "Unlimited";
  if (current === null) return `0 / ${limit}`;
  return `${current} / ${limit}`;
}

function toUsageLine(
  key: UsageEventType,
  label: string,
  tier: BillingTier,
  snapshot: UsageSnapshot | null,
): UsageLine {
  const tierLimits = getTierLimits(tier);
  const staticLimit = key === "message" ? tierLimits.messagesPerMonth : tierLimits.documents;
  const limit = snapshot?.limit === Number.POSITIVE_INFINITY ? null : snapshot?.limit ?? staticLimit;

  return {
    key,
    label,
    current: snapshot ? snapshot.current : 0,
    limit,
    resetsAt: snapshot?.resetsAt.toISOString() ?? null,
    available: Boolean(snapshot),
  };
}

async function getUsageLines(userId: string, tier: BillingTier): Promise<UsageLine[]> {
  const entries: Array<[UsageEventType, string]> = [
    ["message", "Messages this month"],
    ["doc_upload", "Knowledge-base uploads"],
  ];

  const snapshots = await Promise.all(
    entries.map(async ([key]) => {
      try {
        return await checkLimit(userId, key);
      } catch {
        return null;
      }
    }),
  );

  return entries.map(([key, label], index) => toUsageLine(key, label, tier, snapshots[index] ?? null));
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const [params, user, billingSummary] = await Promise.all([
    searchParams,
    currentUser(),
    getBillingSummary(userId),
  ]);
  const usageLines = await getUsageLines(userId, billingSummary.tier);
  const billingReady = isStripeCheckoutConfigured();
  const portalReady = isStripePortalConfigured();
  const hasPaidPlan = billingSummary.tier === "pro" || billingSummary.tier === "team";
  const canManageBilling = portalReady && Boolean(billingSummary.stripeCustomerId);
  const primaryEmail = user?.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "No email on file";
  const displayName = user?.firstName || user?.username || primaryEmail.split("@")[0] || "Account";
  const periodEnd = formatDate(billingSummary.currentPeriodEnd);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
        <div className="animate-rise-in space-y-6">
          <Eyebrow>Account</Eyebrow>
          {params.billing === "success" || params.billing === "canceled" ? (
            <div className="max-w-2xl rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-dim)]">
              {params.billing === "success"
                ? "Checkout completed. Your plan will update here as soon as Stripe confirms it."
                : "Checkout was canceled. Your current plan has not changed."}
            </div>
          ) : null}
          <div className="space-y-3">
            <h1 className="max-w-4xl text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[56px]">
              Manage your account and plan.
            </h1>
            <p className="max-w-2xl text-[20px] leading-8 text-[var(--text-dim)]">
              Plan, billing, and usage live here. Profile controls stay in the top-right account menu.
            </p>
          </div>
        </div>

        <aside className="editorial-card animate-rise-in-delay-1 p-5 sm:p-6">
          <Eyebrow>Current plan</Eyebrow>
          <div className="mt-5 space-y-5">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[34px] font-semibold leading-none text-[var(--text)]">
                  {planLabels[billingSummary.tier]}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
                  {billingSummary.subscriptionStatus
                    ? `Subscription status: ${billingSummary.subscriptionStatus}.`
                    : "No active paid subscription."}
                  {periodEnd ? ` Current period ends ${periodEnd}.` : ""}
                </p>
              </div>
              <div className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text)]">
                <CreditCard className="size-4" />
              </div>
            </div>

            <AccountBillingActions
              billingReady={billingReady}
              canManageBilling={canManageBilling}
              hasPaidPlan={hasPaidPlan}
            />
          </div>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="editorial-card animate-rise-in p-5 sm:p-6">
          <div className="flex items-center gap-3 text-[var(--text-dim)]">
            <Mail className="size-4" />
            <Eyebrow>Identity</Eyebrow>
          </div>
          <h2 className="mt-5 text-[24px] font-medium leading-8 text-[var(--text)]">{displayName}</h2>
          <p className="mt-2 break-all text-sm leading-6 text-[var(--text-dim)]">{primaryEmail}</p>
        </div>

        <div className="editorial-card animate-rise-in-delay-1 p-5 sm:p-6">
          <div className="flex items-center gap-3 text-[var(--text-dim)]">
            <ShieldCheck className="size-4" />
            <Eyebrow>Billing status</Eyebrow>
          </div>
          <h2 className="mt-5 text-[24px] font-medium leading-8 text-[var(--text)]">
            {billingReady ? "Stripe ready" : "Billing unavailable"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
            {billingReady
              ? "Checkout and account billing use the configured Stripe production routes."
              : "Billing actions are disabled until Stripe and the database are configured."}
          </p>
        </div>

        <div className="editorial-card animate-rise-in-delay-2 p-5 sm:p-6">
          <div className="flex items-center gap-3 text-[var(--text-dim)]">
            <Sparkles className="size-4" />
            <Eyebrow>Upgrade path</Eyebrow>
          </div>
          <h2 className="mt-5 text-[24px] font-medium leading-8 text-[var(--text)]">
            {hasPaidPlan ? "Paid access active" : "Pro is available"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
            {hasPaidPlan
              ? "Use Manage billing for invoices, payment method updates, and cancellation controls."
              : "Upgrade to Pro for unlimited courses and larger knowledge-base capacity."}
          </p>
        </div>
      </section>

      <section>
        <div className="editorial-card animate-rise-in p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <Eyebrow>Usage</Eyebrow>
            <Gauge className="size-4 text-[var(--text-faint)]" />
          </div>
          <div className="mt-6 space-y-4">
            {usageLines.map((line) => {
              const finiteLimit = typeof line.limit === "number" && Number.isFinite(line.limit);
              const value = finiteLimit && line.current !== null
                ? Math.min(100, Math.round((line.current / line.limit!) * 100))
                : 100;

              return (
                <div key={line.key} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[var(--text-dim)]">{line.label}</span>
                    <span className="text-[var(--text)]">{formatLimit(line.current, line.limit)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-[var(--border)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-[900ms] ease-[var(--ease-signature)]"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <p className="text-xs leading-5 text-[var(--text-faint)]">
                    {!line.available
                      ? "Usage data will appear once the production database has counters for this account."
                      : line.resetsAt
                        ? `Resets ${formatDate(line.resetsAt)}.`
                        : hasUnlimitedAllowance(line.limit)
                          ? "No monthly cap on this plan."
                          : "Monthly allowance."}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
