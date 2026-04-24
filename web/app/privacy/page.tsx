export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-10 sm:px-8">
      <div className="space-y-3">
        <p className="eyebrow">Privacy</p>
        <h1 className="serif text-5xl font-semibold tracking-tight text-[var(--text)]">
          Privacy policy
        </h1>
      </div>
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] p-6 text-sm leading-7 text-[var(--text-dim)]">
        <p>We store account identifiers from Clerk, billing state tied to Stripe customer ids, and product usage records needed to enforce plan limits and support the service.</p>
        <p>Uploaded learning materials and generated course data are used to create and serve your courses. Operational logs may be retained for debugging, abuse prevention, and reliability.</p>
        <p>We do not sell personal data. Third-party processors currently include Clerk for authentication, Stripe for billing, and our hosting/database providers for app delivery.</p>
        <p>To request account-related help or deletion support, email <a className="underline" href="mailto:jacobheller32@gmail.com">jacobheller32@gmail.com</a>.</p>
      </div>
    </main>
  );
}
