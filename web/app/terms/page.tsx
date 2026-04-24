export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-10 sm:px-8">
      <div className="space-y-3">
        <p className="eyebrow">Terms</p>
        <h1 className="serif text-5xl font-semibold tracking-tight text-[var(--text)]">
          Terms of service
        </h1>
      </div>
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] p-6 text-sm leading-7 text-[var(--text-dim)]">
        <p>Tuto is a hosted learning product available through <span className="text-[var(--text)]">tuto.chat</span>. Use the service lawfully and do not attempt to abuse access limits, scrape other users’ data, or use the platform to process harmful or unauthorized content.</p>
        <p>Paid access is tied to successful billing and may be reduced or removed if subscriptions lapse, payments fail, or abuse is detected.</p>
        <p>The product is still early-stage. We aim for reliability, but availability, generated content quality, and feature coverage are not guaranteed without interruption.</p>
        <p>Questions about these terms can be sent to <a className="underline" href="mailto:jacobheller32@gmail.com">jacobheller32@gmail.com</a>.</p>
      </div>
    </main>
  );
}
