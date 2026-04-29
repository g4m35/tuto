"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Building2, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { BillingTier } from "@/lib/limits";
import { trackMarketingEvent } from "@/lib/marketing-client";

type CheckoutPlan = "pro" | "team";
type EnterpriseState = "idle" | "submitting" | "success" | "error";

interface PricingCard {
  plan: CheckoutPlan;
  name: string;
  price: string;
  summary: string;
  features: string[];
  checkoutEnabled: boolean;
  ctaLabel: string;
}

interface PricingClientProps {
  billingReady: boolean;
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
    price: "$20/mo",
    summary: "For individual learners who want more generation room and deeper practice.",
    features: [
      "Unlimited course creation",
      "10 document knowledge bases",
      "Unlimited guided practice",
    ],
    checkoutEnabled: true,
    ctaLabel: "Choose Pro",
  },
  {
    plan: "team",
    name: "Team",
    price: "$65/mo",
    summary: "For teams that need the larger shared-use tier and direct billing through Stripe.",
    features: [
      "Team tier limits after Stripe checkout",
      "Direct billing management in Stripe",
      "Priority support for shared learning workflows",
    ],
    checkoutEnabled: true,
    ctaLabel: "Choose Team",
  },
];

function EnterpriseContactForm() {
  const [state, setState] = useState<EnterpriseState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      useCase: "Enterprise",
      materialType: String(formData.get("organizationType") ?? ""),
      notes: [
        `Organization: ${String(formData.get("organization") ?? "")}`,
        `Seats: ${String(formData.get("seats") ?? "")}`,
        `Need: ${String(formData.get("notes") ?? "")}`,
      ].join("\n"),
      marketingOptIn: true,
      pageUrl: window.location.href,
      referrer: document.referrer,
      source: "enterprise_pricing",
    };

    trackMarketingEvent("enterprise_inquiry_started", {
      organization_type: payload.materialType,
      seats: String(formData.get("seats") ?? ""),
    });

    try {
      const response = await fetch("/api/beta-signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Unable to send the enterprise request right now.");
      }

      setState("success");
      trackMarketingEvent("enterprise_inquiry_completed", {
        organization_type: payload.materialType,
      });
    } catch (nextError) {
      setState("error");
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to send the enterprise request right now.",
      );
      trackMarketingEvent("enterprise_inquiry_failed", {
        error:
          nextError instanceof Error
            ? nextError.message
            : "Unable to send the enterprise request right now.",
      });
    }
  }

  return (
    <section
      id="enterprise"
      className="surface-card grid gap-6 rounded-[var(--radius-lg)] border border-[var(--border)] p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-7"
    >
      <div className="space-y-5">
        <div className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elev)]">
          <Building2 className="size-5 text-[var(--text)]" />
        </div>
        <div className="space-y-3">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Enterprise
          </div>
          <h2 className="serif text-[2rem] font-semibold tracking-tight text-[var(--text)]">
            Schools, companies, and cohorts.
          </h2>
          <p className="max-w-xl text-sm leading-6 text-[var(--text-dim)]">
            Enterprise is for shared learning programs that need seats, onboarding help, centralized billing, and a path toward admin controls or SSO.
          </p>
        </div>
        <ul className="space-y-3 text-sm leading-6 text-[var(--text-dim)]">
          {[
            "Seat-based pricing for classes, teams, and departments",
            "Invoice or contract billing instead of self-serve checkout",
            "Pilot support for training docs, course templates, and rollout planning",
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="mt-0.5 size-4 text-[var(--accent)]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {state === "success" ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-elev)] p-5">
          <Check className="size-5 text-[var(--accent)]" />
          <h3 className="mt-4 text-xl font-medium tracking-normal text-[var(--text)]">
            Enterprise request received.
          </h3>
          <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
            It is in the operator queue with your org details and rollout notes.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[12px] text-[var(--text-dim)]">Name</span>
              <input name="name" className="h-11 w-full rounded-[10px] border border-[var(--border)] bg-[#080808] px-3 text-[14px] outline-none focus:border-[var(--border-strong)]" />
            </label>
            <label className="space-y-2">
              <span className="text-[12px] text-[var(--text-dim)]">Work email</span>
              <input name="email" type="email" required className="h-11 w-full rounded-[10px] border border-[var(--border)] bg-[#080808] px-3 text-[14px] outline-none focus:border-[var(--border-strong)]" />
            </label>
            <label className="space-y-2">
              <span className="text-[12px] text-[var(--text-dim)]">Organization</span>
              <input name="organization" required className="h-11 w-full rounded-[10px] border border-[var(--border)] bg-[#080808] px-3 text-[14px] outline-none focus:border-[var(--border-strong)]" />
            </label>
            <label className="space-y-2">
              <span className="text-[12px] text-[var(--text-dim)]">Type</span>
              <select name="organizationType" className="h-11 w-full rounded-[10px] border border-[var(--border)] bg-[#080808] px-3 text-[14px] outline-none focus:border-[var(--border-strong)]">
                <option>School</option>
                <option>Company</option>
                <option>Training team</option>
                <option>Tutoring/coaching group</option>
              </select>
            </label>
          </div>
          <label className="space-y-2">
            <span className="text-[12px] text-[var(--text-dim)]">Estimated seats</span>
            <input name="seats" inputMode="numeric" placeholder="25, 100, 500..." className="h-11 w-full rounded-[10px] border border-[var(--border)] bg-[#080808] px-3 text-[14px] outline-none focus:border-[var(--border-strong)]" />
          </label>
          <label className="space-y-2">
            <span className="text-[12px] text-[var(--text-dim)]">What would you roll out first?</span>
            <textarea name="notes" rows={4} className="w-full resize-none rounded-[10px] border border-[var(--border)] bg-[#080808] px-3 py-3 text-[14px] leading-6 outline-none focus:border-[var(--border-strong)]" />
          </label>
          {error ? <p className="text-[13px] text-red-300">{error}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={state === "submitting"}>
            {state === "submitting" ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {state === "submitting" ? "Sending" : "Request enterprise plan"}
            {state !== "submitting" ? <ArrowRight data-icon="inline-end" /> : null}
          </Button>
        </form>
      )}
    </section>
  );
}

export function PricingClient({ billingReady, billingSummary }: PricingClientProps) {
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
  const billingUnavailable = !billingReady || billingSummary?.billingEnabled === false;

  useEffect(() => {
    trackMarketingEvent("pricing_page_viewed", {
      tier: billingSummary?.tier,
      billing_ready: billingReady,
      billing_enabled: billingSummary?.billingEnabled,
      source: searchParams.get("source"),
      from: searchParams.get("from"),
    });
  }, [billingReady, billingSummary?.billingEnabled, billingSummary?.tier, searchParams]);

  async function openBillingPortal() {
    setManagingBilling(true);
    setError(null);
    trackMarketingEvent("billing_portal_started", {
      tier: billingSummary?.tier,
      subscription_status: billingSummary?.subscriptionStatus,
    });

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
      trackMarketingEvent("billing_portal_failed", {
        error:
          portalError instanceof Error
            ? portalError.message
            : "Unable to open billing management right now.",
      });
    }
  }

  async function startCheckout(plan: CheckoutPlan) {
    if (billingUnavailable) {
      setError("Billing is unavailable until the database is configured.");
      trackMarketingEvent("checkout_blocked", { plan, reason: "billing_unavailable" });
      return;
    }

    setLoadingPlan(plan);
    setError(null);
    trackMarketingEvent("checkout_started", {
      plan,
      tier: billingSummary?.tier,
    });

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, returnPath: "/pricing" }),
      });

      const data = (await response.json().catch(() => null)) as BillingActionResponse | null;

      if (!response.ok) {
        if (response.status === 409 && data?.manage_url) {
          trackMarketingEvent("checkout_redirected_to_portal", { plan });
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
      trackMarketingEvent("checkout_failed", {
        plan,
        error:
          checkoutError instanceof Error
            ? checkoutError.message
            : "Unable to start checkout right now.",
      });
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
              Go directly to the dashboard when you want to use Tuto.
              {billingSummary?.subscriptionStatus
                ? ` Subscription status: ${billingSummary.subscriptionStatus}.`
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
          const cardDisabled =
            loading ||
            managingBilling ||
            billingUnavailable ||
            hasPaidPlan ||
            !card.checkoutEnabled;

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
                  disabled={cardDisabled}
                  onClick={() => startCheckout(card.plan)}
                >
                  {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  {!card.checkoutEnabled
                    ? card.ctaLabel
                    : hasPaidPlan
                    ? "Current plan active"
                    : loading
                      ? "Redirecting to Stripe"
                      : billingUnavailable
                        ? "Billing unavailable"
                        : card.ctaLabel}
                </Button>
              </div>
            </section>
          );
        })}
      </div>
      <EnterpriseContactForm />
    </div>
  );
}
