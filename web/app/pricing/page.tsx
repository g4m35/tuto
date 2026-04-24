import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isStripeCheckoutConfigured } from "@/lib/billing";
import { getBillingSummary } from "@/lib/billing-server";
import { PricingClient } from "./PricingClient";

export default async function PricingPage() {
  const { userId } = await auth();
  const billingSummary = userId ? await getBillingSummary(userId) : null;
  const billingReady = isStripeCheckoutConfigured();

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Billing
            </div>
            <div className="space-y-2">
              <h1 className="serif text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
                Pick the plan that matches your learning load.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--text-dim)]">
                Free gets you started. Paid plans unlock heavier course generation, more knowledge-base uploads, and fewer artificial limits while the product moves toward launch.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>

        <Suspense>
          <PricingClient billingSummary={billingSummary} billingReady={billingReady} />
        </Suspense>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-dim)]">
          <span>Questions before paying?</span>
          <Link className="underline underline-offset-4 hover:text-[var(--text)]" href="/support">
            Support
          </Link>
          <Link className="underline underline-offset-4 hover:text-[var(--text)]" href="/terms">
            Terms
          </Link>
          <Link className="underline underline-offset-4 hover:text-[var(--text)]" href="/privacy">
            Privacy
          </Link>
          <Link
            className="underline underline-offset-4 hover:text-[var(--text)]"
            href="/refund-policy"
          >
            Refunds
          </Link>
        </div>
      </div>
    </main>
  );
}
