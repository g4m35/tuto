import Link from "next/link";
import { ArrowLeft, BadgeDollarSign, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const supportEmail = "support@tuto.app";

export default function RefundPolicyPage() {
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
            <BadgeDollarSign className="size-5" />
          </div>
          <p className="mt-4 eyebrow">Refund policy</p>
          <h1 className="serif mt-3 text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
            A simple refund policy for the first paid release.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)] sm:text-lg">
            We want the early paid launch to feel low-risk. If tuto is not working as promised,
            ask for help quickly and we will review the subscription fairly.
          </p>
        </header>

        <section className="grid gap-5">
          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="gap-3 border-b border-[var(--border)] px-6 py-6">
              <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--accent)]">
                <RotateCcw className="size-5" />
              </div>
              <CardTitle className="text-2xl text-[var(--text)]">Refund window</CardTitle>
              <CardDescription className="leading-6 text-[var(--text-dim)]">
                The policy is designed for first-time launch customers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-6 text-sm leading-6 text-[var(--text-dim)]">
              <p>First subscription purchases are eligible for a refund request within 7 calendar days of the initial charge.</p>
              <p>Renewals are generally non-refundable once a new billing period begins, unless required by law or approved for a clear billing error.</p>
              <p>If a payment succeeds but the paid tier does not unlock correctly, contact support first. We will prioritize fixing access before asking you to re-purchase.</p>
            </CardContent>
          </Card>

          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="gap-3 border-b border-[var(--border)] px-6 py-6">
              <CardTitle className="text-2xl text-[var(--text)]">How to request a refund</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-6 text-sm leading-6 text-[var(--text-dim)]">
              <p>Email <a className="font-medium text-[var(--accent)]" href={`mailto:${supportEmail}`}>{supportEmail}</a> from the same address used for your account, or include that account email in the message.</p>
              <p>Include the Stripe receipt or enough billing detail for us to identify the charge quickly.</p>
              <p>Approved refunds are issued back to the original payment method through Stripe.</p>
            </CardContent>
          </Card>

          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="gap-3 border-b border-[var(--border)] px-6 py-6">
              <CardTitle className="text-2xl text-[var(--text)]">Related pages</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 px-6 py-6 text-sm">
              <Link href="/terms" className="font-medium text-[var(--accent)]">
                Terms
              </Link>
              <Link href="/privacy" className="font-medium text-[var(--accent)]">
                Privacy
              </Link>
              <Link href="/support" className="font-medium text-[var(--accent)]">
                Support
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
