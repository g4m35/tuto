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
        <p>First-time purchases are eligible for a refund request within 7 days when the service materially fails to deliver the billed launch slice.</p>
        <p>To request a refund, email support@tuto.app from the billing email on the account and include the approximate purchase date.</p>
        <p>Renewals, partial-period requests, and abuse-related suspensions are handled case by case.</p>
      </div>
    </main>
  );
}
