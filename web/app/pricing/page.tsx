import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PricingClient } from "./PricingClient";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Billing
            </div>
            <div className="space-y-2">
              <h1 className="serif text-5xl font-semibold tracking-tight text-[var(--text)]">
                Pick the plan that matches your learning load.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[var(--text-dim)]">
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
          <PricingClient />
        </Suspense>
      </div>
    </main>
  );
}
