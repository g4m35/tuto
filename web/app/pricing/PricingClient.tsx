"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { BillingTier } from "@/lib/limits";

type CheckoutPlan = "pro" | "team";

interface PricingCard {
  plan: CheckoutPlan;
  name: string;
  price: string;
  summary: string;
  features: string[];
}

interface PricingClientProps {
  billingSummary: {
    billingEnabled: boolean;
    tier: BillingTier;
    stripeCustomerId: string | null;
    subscriptionStatus: string | null;
    currentPeriodEnd: string | null;
  } | null;
}

interface BillingActionResponse {
  url?: string;
  error?: string;
  manage_url?: string;
}

const pricingCards: PricingCard[] = [
  {
    plan: "pro",
    name: "Pro",
    price: "$24/mo",
    summary: "For individual learners who want more generation room and deeper practice.",
    features: [
      "Unlimited course creation",
      "10 document knowledge bases",
      "Unlimited guided practice",
    ],
  },
  {
    plan: "team",
    name: "Team",
    price: "$79/mo",
    summary: "For small teams sharing a heavier workflow and more source material.",
    features: [
      "Unlimited document knowledge bases",
      "Shared billing tier for operator accounts",
      "Priority launch support runway",
    ],
  },
];

export function PricingClient({ billingSummary }: PricingClientProps) {
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const [managingBilling, setManagingBilling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusMessage = useMemo(() => {
    const billing = searchParams.get("billing");
    if (billing === "canceled") {
      return "Checkout was canceled. You can pick up where you left off any time.";
    }
    if (billing === "success") {
      return "Checkout completed. Your billing tier should update as soon as the webhook lands.";
    }
    return null;
  }, [searchParams]);

  const hasPaidPlan = billingSummary?.tier === "pro" || billingSummary?.tier === "team";
  const billingUnavailable = billingSummary?.billingEnabled === false;

  async function openBillingPortal() {
    setManagingBilling(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = (await response.json().catch(() => null)) as BillingActionResponse | null;

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Unable to open billing management right now.");
      }

      window.location.assign(data.url);
    } catch (portalError) {
      setError(
        portalError instanceof Error
          ? portalError.message
          : "Unable to open billing management right now.",
      );
      setManagingBilling(false);
    }
  }

  async function startCheckout(plan: CheckoutPlan) {
    if (billingUnavailable) {
      setError("Billing is unavailable until the database is configured.");
      return;
    }

    setLoadingPlan(plan);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = (await response.json().catch(() => null)) as BillingActionResponse | null;

      if (!response.ok) {
        if (response.status === 409 && data?.manage_url) {
          window.location.assign(data.manage_url);
          return;
        }
        throw new Error(data?.error || "Unable to start checkout right now.");
      }

      if (!data?.url) {
        throw new Error("Unable to start checkout right now.");
      }

      window.location.assign(data.url);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout right now.",
      );
      setLoadingPlan(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 sm:px-7">
      {statusMessage ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text-dim)]">
          {statusMessage}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {hasPaidPlan ? (
        <section className="surface-card flex flex-col gap-5 rounded-[var(--radius-lg)] border border-[var(--border)] p-6">
          <div className="space-y-2">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Current plan
            </div>
            <div className="serif text-[2rem] font-semibold tracking-tight text-[var(--text)]">
              {billingSummary?.tier === "team" ? "Team" : "Pro"}
            </div>
            <p className="max-w-2xl text-sm leading-6 text-[var(--text-dim)]">
              {billingSummary?.subscriptionStatus
                ? `Subscription status: ${billingSummary.subscriptionStatus}.`
                : "Billing is active for this account."}
              {billingSummary?.currentPeriodEnd
                ? ` Current period ends on ${new Date(
                    billingSummary.currentPeriodEnd,
                  ).toLocaleDateString()}.`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={openBillingPortal} disabled={managingBilling}>
              {managingBilling ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {managingBilling ? "Opening billing" : "Manage billing"}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setError(null)}>
              Keep current plan
            </Button>
          </div>
        </section>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {pricingCards.map((card) => {
          const loading = loadingPlan === card.plan;

          return (
            <section
              key={card.plan}
              className="surface-card flex h-full min-h-[22rem] flex-col gap-5 rounded-[var(--radius-lg)] border border-[var(--border)] p-6 lg:p-7"
            >
              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  {card.name}
                </div>
                <div className="serif text-[2rem] font-semibold tracking-tight text-[var(--text)]">
                  {card.price}
                </div>
                <p className="max-w-sm text-sm leading-6 text-[var(--text-dim)]">
                  {card.summary}
                </p>
              </div>
              <ul className="space-y-3 text-sm leading-6 text-[var(--text-dim)]">
                {card.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 text-[var(--accent)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button
                  size="lg"
                  className="w-full"
                  disabled={loading || managingBilling || billingUnavailable || hasPaidPlan}
                  onClick={() => startCheckout(card.plan)}
                >
                  {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  {hasPaidPlan
                    ? "Current plan active"
                    : loading
                      ? "Redirecting to Stripe"
                      : billingUnavailable
                        ? "Billing unavailable"
                        : `Choose ${card.name}`}
                </Button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
