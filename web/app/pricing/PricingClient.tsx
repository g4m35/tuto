"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

type CheckoutPlan = "pro" | "team";

interface PricingCard {
  plan: CheckoutPlan;
  name: string;
  price: string;
  summary: string;
  features: string[];
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

export function PricingClient() {
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
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

  async function startCheckout(plan: CheckoutPlan) {
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

      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Unable to start checkout right now.");
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8">
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
      <div className="grid gap-4 lg:grid-cols-2">
        {pricingCards.map((card) => {
          const loading = loadingPlan === card.plan;

          return (
            <section
              key={card.plan}
              className="surface-card flex h-full flex-col gap-5 rounded-[var(--radius-lg)] border border-[var(--border)] p-6"
            >
              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  {card.name}
                </div>
                <div className="serif text-4xl font-semibold tracking-tight text-[var(--text)]">
                  {card.price}
                </div>
                <p className="max-w-xl text-sm leading-6 text-[var(--text-dim)]">
                  {card.summary}
                </p>
              </div>
              <ul className="space-y-3 text-sm text-[var(--text-dim)]">
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
                  disabled={loading}
                  onClick={() => startCheckout(card.plan)}
                >
                  {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  {loading ? "Redirecting to Stripe" : `Choose ${card.name}`}
                </Button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
