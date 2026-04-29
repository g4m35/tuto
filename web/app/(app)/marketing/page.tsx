import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ArrowRight, Download, Mail, MousePointerClick, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { canAccessOperatorSettings } from "@/lib/admin-access";
import { getMarketingOverview } from "@/lib/marketing-admin";
import { cn } from "@/lib/utils";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="t-eyebrow">
      <span className="t-eyebrow__rule" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <div className="editorial-card min-h-[170px] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <Eyebrow>{label}</Eyebrow>
        <Icon className="size-4 text-[var(--text-faint)]" />
      </div>
      <p className="mt-9 text-[34px] font-semibold leading-none text-[var(--text)]">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">{detail}</p>
    </div>
  );
}

export default async function MarketingPage() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const canAccess = canAccessOperatorSettings(userId, user);

  if (!canAccess) {
    return (
      <div className="editorial-card max-w-3xl px-8 py-8">
        <Eyebrow>Marketing</Eyebrow>
        <h1 className="mt-5 text-[34px] font-semibold leading-tight tracking-normal text-[var(--text)]">
          Operator access required.
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--text-dim)]">
          This dashboard includes beta signup emails and is limited to configured operators.
        </p>
        <Link href="/account" className={cn(buttonVariants({ size: "sm" }), "mt-6")}>
          Back to account
          <ArrowRight data-icon="inline-end" />
        </Link>
      </div>
    );
  }

  const overview = await getMarketingOverview();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-5">
          <Eyebrow>Marketing</Eyebrow>
          <h1 className="max-w-4xl text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[56px]">
            Beta demand and launch funnel.
          </h1>
          <p className="max-w-2xl text-[20px] leading-8 text-[var(--text-dim)]">
            Track landing-page events, beta signups, and the first acquisition loops from production data.
          </p>
        </div>
        <Link href="/api/marketing/beta-signups/export" className={cn(buttonVariants({ size: "lg" }))}>
          <Download data-icon="inline-start" />
          Export signups
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Beta signups"
          value={overview.betaSignupCount}
          detail={`${overview.betaSignupsLast7Days} in the last 7 days`}
          icon={Users}
        />
        <MetricCard
          label="Events"
          value={overview.eventCount}
          detail={`${overview.eventCountLast7Days} in the last 7 days`}
          icon={MousePointerClick}
        />
        <MetricCard
          label="Use cases"
          value={overview.topUseCases.length}
          detail="Segments collected from beta intake"
          icon={Mail}
        />
        <MetricCard
          label="Exports"
          value={5000}
          detail="Latest signup rows available as CSV"
          icon={Download}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="editorial-card p-5 sm:p-6">
          <Eyebrow>Top use cases</Eyebrow>
          <div className="mt-6 space-y-3">
            {overview.topUseCases.length ? overview.topUseCases.map((item) => (
              <div key={item.useCase} className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3 last:border-b-0">
                <span className="text-sm text-[var(--text-dim)]">{item.useCase}</span>
                <span className="text-sm font-medium text-[var(--text)]">{item.count}</span>
              </div>
            )) : (
              <p className="text-sm leading-6 text-[var(--text-dim)]">No beta signups yet.</p>
            )}
          </div>
        </div>

        <div className="editorial-card p-5 sm:p-6">
          <Eyebrow>Recent signups</Eyebrow>
          <div className="mt-6 divide-y divide-[var(--border)]">
            {overview.recentSignups.length ? overview.recentSignups.map((signup) => (
              <div key={`${signup.email}-${signup.createdAt}`} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_160px_130px] lg:items-center">
                <div>
                  <p className="break-all text-sm font-medium text-[var(--text)]">{signup.email}</p>
                  <p className="mt-1 text-xs text-[var(--text-faint)]">
                    {signup.name || "No name"} · {signup.source || "unknown source"}
                  </p>
                </div>
                <p className="text-sm text-[var(--text-dim)]">{signup.useCase || "Unspecified"}</p>
                <p className="text-xs text-[var(--text-faint)]">{formatDate(signup.createdAt)}</p>
              </div>
            )) : (
              <p className="py-4 text-sm leading-6 text-[var(--text-dim)]">No beta signups yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="editorial-card p-5 sm:p-6">
        <Eyebrow>Recent events</Eyebrow>
        <div className="mt-6 divide-y divide-[var(--border)]">
          {overview.recentEvents.length ? overview.recentEvents.map((event) => (
            <div key={`${event.name}-${event.distinctId}-${event.createdAt}`} className="grid gap-3 py-4 lg:grid-cols-[220px_minmax(0,1fr)_160px] lg:items-center">
              <p className="text-sm font-medium text-[var(--text)]">{event.name}</p>
              <p className="break-all text-xs text-[var(--text-faint)]">{event.distinctId}</p>
              <p className="text-xs text-[var(--text-faint)]">{formatDate(event.createdAt)}</p>
            </div>
          )) : (
            <p className="py-4 text-sm leading-6 text-[var(--text-dim)]">No marketing events yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
