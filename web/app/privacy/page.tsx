import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const supportEmail = "support@tuto.app";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/pricing"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to pricing
          </Link>
          <Link href="/support" className="text-sm font-medium text-[var(--accent)]">
            Support
          </Link>
        </div>

        <header className="surface-card rounded-[32px] border border-[var(--border)] bg-[var(--bg-elev)]/88 p-6 sm:p-8">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--accent)]">
            <Lock className="size-5" />
          </div>
          <p className="mt-4 eyebrow">Privacy</p>
          <h1 className="serif mt-3 text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
            How tuto handles account, billing, and course data.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)] sm:text-lg">
            tuto collects the minimum account, billing, and usage data needed to run the early paid
            course workflow. We do not sell customer data.
          </p>
        </header>

        <section className="grid gap-5">
          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="gap-3 border-b border-[var(--border)] px-6 py-6">
              <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--accent)]">
                <ShieldCheck className="size-5" />
              </div>
              <CardTitle className="text-2xl text-[var(--text)]">What we collect</CardTitle>
              <CardDescription className="leading-6 text-[var(--text-dim)]">
                The launch product keeps data collection narrow and operational.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-6 text-sm leading-6 text-[var(--text-dim)]">
              <p>Account data: sign-in identity and account identifiers provided through Clerk.</p>
              <p>Billing data: Stripe customer, subscription, and payment status records needed to manage paid tiers. Full payment card details are handled by Stripe, not stored by tuto.</p>
              <p>Product data: uploaded documents, generated course data, and usage events required to provide the course workflow and enforce plan limits.</p>
              <p>Operational data: logs and diagnostics used to investigate failures, prevent abuse, and improve reliability.</p>
            </CardContent>
          </Card>

          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="gap-3 border-b border-[var(--border)] px-6 py-6">
              <CardTitle className="text-2xl text-[var(--text)]">How we use it</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-6 text-sm leading-6 text-[var(--text-dim)]">
              <p>To authenticate users, run the product, store courses, and honor subscription limits.</p>
              <p>To process subscriptions, renewals, cancellations, payment failures, and refund requests.</p>
              <p>To diagnose bugs, protect the service, and communicate about support or billing events.</p>
            </CardContent>
          </Card>

          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="gap-3 border-b border-[var(--border)] px-6 py-6">
              <CardTitle className="text-2xl text-[var(--text)]">Customer choices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-6 text-sm leading-6 text-[var(--text-dim)]">
              <p>You can request account or billing help through <a className="font-medium text-[var(--accent)]" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
              <p>You can manage payment methods and active subscriptions through the Stripe billing portal when it is available for your account.</p>
              <p>Refund handling follows the public <Link href="/refund-policy" className="font-medium text-[var(--accent)]">refund policy</Link>. Product access also remains subject to the <Link href="/terms" className="font-medium text-[var(--accent)]">terms</Link>.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
