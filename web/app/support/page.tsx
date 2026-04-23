import Link from "next/link";
import { ArrowLeft, LifeBuoy, Mail, ReceiptText } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const supportEmail = "support@tuto.app";

export default function SupportPage() {
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
          <Link href={`mailto:${supportEmail}`} className="text-sm font-medium text-[var(--accent)]">
            {supportEmail}
          </Link>
        </div>

        <header className="surface-card rounded-[32px] border border-[var(--border)] bg-[var(--bg-elev)]/88 p-6 sm:p-8">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--accent)]">
            <LifeBuoy className="size-5" />
          </div>
          <p className="mt-4 eyebrow">Support</p>
          <h1 className="serif mt-3 text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
            Help for the early paid launch.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)] sm:text-lg">
            tuto support is handled directly by email during the early launch. Use the support inbox
            for billing questions, account issues, refund requests, or course workflow problems.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="gap-3 border-b border-[var(--border)] px-6 py-6">
              <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--accent)]">
                <Mail className="size-5" />
              </div>
              <CardTitle className="text-2xl text-[var(--text)]">Contact</CardTitle>
              <CardDescription className="leading-6 text-[var(--text-dim)]">
                Send all customer support requests to the launch inbox.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-6 py-6 text-sm leading-6 text-[var(--text-dim)]">
              <p>
                Email:{" "}
                <a className="font-medium text-[var(--accent)]" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </p>
              <p>Response target: within 2 business days for product questions and billing issues.</p>
              <p>Include the account email used for sign-in and any Stripe receipt when the issue is billing-related.</p>
            </CardContent>
          </Card>

          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="gap-3 border-b border-[var(--border)] px-6 py-6">
              <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--accent)]">
                <ReceiptText className="size-5" />
              </div>
              <CardTitle className="text-2xl text-[var(--text)]">What support covers</CardTitle>
              <CardDescription className="leading-6 text-[var(--text-dim)]">
                The launch support lane is intentionally focused.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-6 py-6 text-sm leading-6 text-[var(--text-dim)]">
              <p>Billing: checkout issues, failed renewals, refund requests, and subscription changes.</p>
              <p>Account: sign-in problems, tier mismatch after payment, and billing portal access.</p>
              <p>Product: course creation blockers, upload failures, and quota questions on the launch workflow.</p>
            </CardContent>
          </Card>
        </section>

        <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
          <CardHeader className="gap-3 border-b border-[var(--border)] px-6 py-6">
            <CardTitle className="text-2xl text-[var(--text)]">Related policies</CardTitle>
            <CardDescription className="leading-6 text-[var(--text-dim)]">
              The support flow pairs with the public launch policies below.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 px-6 py-6 text-sm">
            <Link href="/refund-policy" className="font-medium text-[var(--accent)]">
              Refund policy
            </Link>
            <Link href="/terms" className="font-medium text-[var(--accent)]">
              Terms
            </Link>
            <Link href="/privacy" className="font-medium text-[var(--accent)]">
              Privacy
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
