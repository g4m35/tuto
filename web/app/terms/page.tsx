import Link from "next/link";
import { ArrowLeft, FileText, Shield } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function TermsPage() {
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
          <Link href="/privacy" className="text-sm font-medium text-[var(--accent)]">
            Privacy
          </Link>
        </div>

        <header className="surface-card rounded-[32px] border border-[var(--border)] bg-[var(--bg-elev)]/88 p-6 sm:p-8">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--accent)]">
            <FileText className="size-5" />
          </div>
          <p className="mt-4 eyebrow">Terms</p>
          <h1 className="serif mt-3 text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
            Terms for using tuto during the early paid launch.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)] sm:text-lg">
            These terms cover account access, acceptable use, billing-linked access to paid plans,
            and the limits of an early-stage product.
          </p>
        </header>

        <section className="grid gap-5">
          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="gap-3 border-b border-[var(--border)] px-6 py-6">
              <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--accent)]">
                <Shield className="size-5" />
              </div>
              <CardTitle className="text-2xl text-[var(--text)]">Account and acceptable use</CardTitle>
              <CardDescription className="leading-6 text-[var(--text-dim)]">
                Paid access is tied to your account, not shared anonymously.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-6 text-sm leading-6 text-[var(--text-dim)]">
              <p>You are responsible for activity under your account and for keeping your sign-in access secure.</p>
              <p>You may not use tuto to break the law, abuse third-party systems, interfere with the service, or upload content you do not have the right to use.</p>
              <p>We may suspend or limit access when abuse, fraud, or platform safety issues are detected.</p>
            </CardContent>
          </Card>

          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="gap-3 border-b border-[var(--border)] px-6 py-6">
              <CardTitle className="text-2xl text-[var(--text)]">Billing and plan access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-6 text-sm leading-6 text-[var(--text-dim)]">
              <p>Paid tiers are activated and managed through Stripe. Access can change when a subscription starts, renews, fails, is canceled, or is refunded.</p>
              <p>Plan features and usage limits are described on the <Link href="/pricing" className="font-medium text-[var(--accent)]">pricing page</Link>. Pricing amounts themselves are controlled in Stripe so the checkout amount is the source of truth.</p>
              <p>Refunds follow the public <Link href="/refund-policy" className="font-medium text-[var(--accent)]">refund policy</Link>.</p>
            </CardContent>
          </Card>

          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="gap-3 border-b border-[var(--border)] px-6 py-6">
              <CardTitle className="text-2xl text-[var(--text)]">Service changes and limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-6 text-sm leading-6 text-[var(--text-dim)]">
              <p>tuto is an early-stage product. Features, quotas, and packaging may change as the launch matures.</p>
              <p>We aim for reliability, but the service is provided on an as-available basis and may experience bugs, outages, or provider-related interruptions.</p>
              <p>To the maximum extent allowed by law, tuto is not liable for indirect, incidental, or consequential damages arising from use of the product.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
