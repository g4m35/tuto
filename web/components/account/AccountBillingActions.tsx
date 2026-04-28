"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CreditCard, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface BillingActionResponse {
  url?: string;
  error?: string;
  manage_url?: string;
}

export function AccountBillingActions({
  billingReady,
  canManageBilling,
  hasPaidPlan,
}: {
  billingReady: boolean;
  canManageBilling: boolean;
  hasPaidPlan: boolean;
}) {
  const [pendingAction, setPendingAction] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openBillingPortal() {
    setPendingAction("portal");
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await response.json().catch(() => null)) as BillingActionResponse | null;

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Unable to open billing management right now.");
      }

      window.location.assign(data.url);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to open billing management right now.");
      setPendingAction(null);
    }
  }

  async function startProCheckout() {
    setPendingAction("checkout");
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro", returnPath: "/account" }),
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
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to start checkout right now.");
      setPendingAction(null);
    }
  }

  const checkoutDisabled = !billingReady || pendingAction !== null || hasPaidPlan;
  const portalDisabled = !canManageBilling || pendingAction !== null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {hasPaidPlan || canManageBilling ? (
          <Button size="lg" onClick={openBillingPortal} disabled={portalDisabled}>
            {pendingAction === "portal" ? <LoaderCircle className="size-4 animate-spin" /> : <CreditCard data-icon="inline-start" />}
            {pendingAction === "portal" ? "Opening billing" : "Manage billing"}
          </Button>
        ) : (
          <Button size="lg" onClick={startProCheckout} disabled={checkoutDisabled}>
            {pendingAction === "checkout" ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {pendingAction === "checkout" ? "Redirecting to Stripe" : billingReady ? "Upgrade to Pro" : "Billing unavailable"}
            {pendingAction !== "checkout" ? <ArrowRight data-icon="inline-end" /> : null}
          </Button>
        )}

        <Link href="/pricing" className={cn("inline-flex", "[&_svg]:size-4")}>
          <span className="t-btn inline-flex h-[46px] items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-transparent px-[22px] text-[14px] font-medium text-[var(--text)] hover:border-[var(--accent-line)]">
            Compare plans
            <ArrowRight className="size-4" />
          </span>
        </Link>
      </div>

      {error ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-dim)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
