export default function RefundPolicyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-10 sm:px-8">
      <div className="space-y-3">
        <p className="eyebrow">Refunds</p>
        <h1 className="serif text-5xl font-semibold tracking-tight text-[var(--text)]">
          Refund policy
        </h1>
      </div>
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] p-6 text-sm leading-7 text-[var(--text-dim)]">
        <p>Tuto does not offer routine convenience refunds, trial-style cancellations after use, or partial-period refunds.</p>
        <p>A refund may be issued when the live web product materially breaks in a way that blocks normal use and we cannot resolve it in a reasonable time.</p>
        <p>To request review, email <a className="underline" href="mailto:jacobheller32@gmail.com">jacobheller32@gmail.com</a> from the billing email on the account, include the approximate purchase date, and describe the web-breaking issue you hit.</p>
        <p>Billing disputes tied to abuse, policy violations, or successful access to the paid service are not guaranteed a refund.</p>
      </div>
    </main>
  );
}
