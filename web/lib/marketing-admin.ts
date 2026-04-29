import "server-only";

import { formatCsvCell } from "@/lib/csv";
import { isDatabaseConfigured, query } from "@/lib/db";

export interface MarketingOverview {
  betaSignupCount: number;
  betaSignupsLast7Days: number;
  eventCount: number;
  eventCountLast7Days: number;
  topUseCases: Array<{ useCase: string; count: number }>;
  recentSignups: BetaSignupSummary[];
  recentEvents: MarketingEventSummary[];
}

export interface BetaSignupSummary {
  email: string;
  name: string | null;
  useCase: string | null;
  materialType: string | null;
  marketingOptIn: boolean;
  source: string | null;
  createdAt: string;
}

export interface MarketingEventSummary {
  name: string;
  distinctId: string;
  source: string | null;
  createdAt: string;
}

interface CountRow {
  count: string;
}

interface UseCaseRow {
  use_case: string | null;
  count: string;
}

interface BetaSignupRow {
  email: string;
  name: string | null;
  use_case: string | null;
  material_type: string | null;
  marketing_opt_in: boolean;
  source: string | null;
  created_at: Date;
}

interface MarketingEventRow {
  name: string;
  distinct_id: string;
  source: string | null;
  created_at: Date;
}

function toNumber(value: string | undefined) {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDate(value: Date) {
  return value.toISOString();
}

export function assertMarketingDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("Marketing dashboard requires DATABASE_URL or POSTGRES_URL.");
  }
}

export async function getMarketingOverview(): Promise<MarketingOverview> {
  assertMarketingDatabaseConfigured();

  const [
    betaSignupCount,
    betaSignupsLast7Days,
    eventCount,
    eventCountLast7Days,
    topUseCases,
    recentSignups,
    recentEvents,
  ] = await Promise.all([
    query<CountRow>("select count(*)::text as count from beta_signups"),
    query<CountRow>(
      "select count(*)::text as count from beta_signups where created_at >= now() - interval '7 days'",
    ),
    query<CountRow>("select count(*)::text as count from marketing_events"),
    query<CountRow>(
      "select count(*)::text as count from marketing_events where created_at >= now() - interval '7 days'",
    ),
    query<UseCaseRow>(
      `
        select coalesce(nullif(use_case, ''), 'Unspecified') as use_case, count(*)::text as count
        from beta_signups
        group by 1
        order by count(*) desc, 1 asc
        limit 6
      `,
    ),
    query<BetaSignupRow>(
      `
        select email, name, use_case, material_type, marketing_opt_in, source, created_at
        from beta_signups
        order by created_at desc
        limit 12
      `,
    ),
    query<MarketingEventRow>(
      `
        select name, distinct_id, source, created_at
        from marketing_events
        order by created_at desc
        limit 12
      `,
    ),
  ]);

  return {
    betaSignupCount: toNumber(betaSignupCount.rows[0]?.count),
    betaSignupsLast7Days: toNumber(betaSignupsLast7Days.rows[0]?.count),
    eventCount: toNumber(eventCount.rows[0]?.count),
    eventCountLast7Days: toNumber(eventCountLast7Days.rows[0]?.count),
    topUseCases: topUseCases.rows.map((row) => ({
      useCase: row.use_case ?? "Unspecified",
      count: toNumber(row.count),
    })),
    recentSignups: recentSignups.rows.map((row) => ({
      email: row.email,
      name: row.name,
      useCase: row.use_case,
      materialType: row.material_type,
      marketingOptIn: row.marketing_opt_in,
      source: row.source,
      createdAt: toIsoDate(row.created_at),
    })),
    recentEvents: recentEvents.rows.map((row) => ({
      name: row.name,
      distinctId: row.distinct_id,
      source: row.source,
      createdAt: toIsoDate(row.created_at),
    })),
  };
}

export async function getBetaSignupsCsv() {
  assertMarketingDatabaseConfigured();

  const result = await query<BetaSignupRow>(
    `
      select email, name, use_case, material_type, marketing_opt_in, source, created_at
      from beta_signups
      order by created_at desc
      limit 5000
    `,
  );

  const rows = [
    ["email", "name", "use_case", "material_type", "marketing_opt_in", "source", "created_at"],
    ...result.rows.map((row) => [
      row.email,
      row.name,
      row.use_case,
      row.material_type,
      row.marketing_opt_in,
      row.source,
      toIsoDate(row.created_at),
    ]),
  ];

  return rows.map((row) => row.map(formatCsvCell).join(",")).join("\n");
}
