import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-10 sm:px-8">
      <div className="space-y-3">
        <p className="eyebrow">Support</p>
        <h1 className="serif text-5xl font-semibold tracking-tight text-[var(--text)]">
          Launch support
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-[var(--text-dim)]">
          Early customers can reach us at <a className="underline" href="mailto:support@tuto.app">support@tuto.app</a>.
          We aim to respond within one business day for billing, access, and course-generation issues.
        </p>
      </div>
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] p-6 text-sm leading-7 text-[var(--text-dim)]">
        <p>Best first message: include the email on your account, what you were trying to do, and any error you saw.</p>
        <p>For billing questions, add the approximate checkout time so we can line it up with Stripe events quickly.</p>
        <p>
          Related policies: <Link className="underline" href="/refund-policy">refunds</Link>,{" "}
          <Link className="underline" href="/terms">terms</Link>,{" "}
          <Link className="underline" href="/privacy">privacy</Link>.
        </p>
      </div>
    </main>
  );
}
