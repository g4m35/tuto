import "server-only";

import { randomUUID } from "node:crypto";
import type { PoolClient, QueryResultRow } from "pg";
import { getEffectiveBillingTier } from "@/lib/billing-status";
import { getTierLimits, hasUnlimitedAllowance, type BillingTier } from "@/lib/limits";
import { assertDatabaseConfigured, isDatabaseConfigured, query, transaction } from "@/lib/db";

export type UsageEventType = "message" | "doc_upload" | "course_created";

interface UserTierRow extends QueryResultRow {
  tier: BillingTier | string;
  subscription_status: string | null;
}

interface UsageCounterRow extends QueryResultRow {
  used: number;
  reserved: number;
}

interface UsageReservationRow extends QueryResultRow {
  clerk_id: string;
  event_type: UsageEventType;
  period_start: Date;
  quantity: number;
}

export interface UsageSnapshot {
  allowed: boolean;
  current: number;
  used: number;
  reserved: number;
  limit: number;
  resetsAt: Date;
  tier: BillingTier;
}

export interface UsageReservation {
  id: string | null;
  clerkId: string;
  eventType: UsageEventType;
  quantity: number;
  limit: number;
  current: number;
  resetsAt: Date;
  tier: BillingTier;
  metadata: Record<string, unknown>;
}

export type UsageReservationResult =
  | { ok: true; reservation: UsageReservation }
  | { ok: false; reason: "limit_reached"; usage: UsageSnapshot };

function getMonthWindow(now = new Date()) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const resetsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));

  return { monthStart, resetsAt };
}

function getLimitForEventType(tier: BillingTier, eventType: UsageEventType): number | null {
  const limits = getTierLimits(tier);

  switch (eventType) {
    case "message":
      return limits.messagesPerMonth;
    case "doc_upload":
      return limits.documents;
    case "course_created":
      return null;
    default:
      return null;
  }
}

async function runQuery<T extends QueryResultRow = QueryResultRow>(
  client: PoolClient | null,
  text: string,
  params: readonly unknown[] = [],
) {
  return client ? client.query<T>(text, [...params]) : query<T>(text, params);
}

async function ensureUserRow(clerkId: string, client: PoolClient | null = null) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await runQuery(
    client,
    `
      insert into users (
        clerk_id,
        tier,
        subscription_status,
        updated_at
      )
      values ($1, 'free', 'inactive', now())
      on conflict (clerk_id) do nothing
    `,
    [clerkId],
  );
}

async function getUserTier(clerkId: string, client: PoolClient | null = null): Promise<BillingTier> {
  await ensureUserRow(clerkId, client);

  const result = await runQuery<UserTierRow>(
    client,
    `
      select tier
           , subscription_status
      from users
      where clerk_id = $1
      limit 1
    `,
    [clerkId],
  );

  const row = result.rows[0];
  return getEffectiveBillingTier(row?.tier, row?.subscription_status);
}

async function releaseExpiredReservations(
  client: PoolClient,
  clerkId: string,
  eventType: UsageEventType,
  periodStart: Date,
) {
  await client.query(
    `
      with expired as (
        update usage_reservations
        set status = 'expired',
            released_at = now()
        where clerk_id = $1
          and event_type = $2
          and period_start = $3
          and status = 'reserved'
          and expires_at < now()
        returning quantity
      ),
      expired_total as (
        select coalesce(sum(quantity), 0)::integer as quantity
        from expired
      )
      update usage_monthly_counters
      set reserved = greatest(0, reserved - expired_total.quantity),
          updated_at = now()
      from expired_total
      where clerk_id = $1
        and event_type = $2
        and period_start = $3
        and expired_total.quantity > 0
    `,
    [clerkId, eventType, periodStart],
  );
}

async function getCounterSnapshot(
  client: PoolClient,
  clerkId: string,
  eventType: UsageEventType,
  periodStart: Date,
): Promise<{ used: number; reserved: number }> {
  const result = await client.query<UsageCounterRow>(
    `
      select used, reserved
      from usage_monthly_counters
      where clerk_id = $1
        and event_type = $2
        and period_start = $3
      limit 1
    `,
    [clerkId, eventType, periodStart],
  );

  return {
    used: Number(result.rows[0]?.used ?? 0),
    reserved: Number(result.rows[0]?.reserved ?? 0),
  };
}

export async function recordUsage(
  clerkId: string,
  eventType: UsageEventType,
  metadata: Record<string, unknown> = {},
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  const { monthStart } = getMonthWindow();

  await transaction(async (client) => {
    await ensureUserRow(clerkId, client);
    const tier = await getUserTier(clerkId, client);
    const tierLimit = getLimitForEventType(tier, eventType);

    await client.query(
      `
        insert into usage_events (
          clerk_id,
          event_type,
          metadata,
          quantity
        )
        values ($1, $2, $3::jsonb, 1)
      `,
      [clerkId, eventType, JSON.stringify(metadata)],
    );

    if (!hasUnlimitedAllowance(tierLimit)) {
      await client.query(
        `
          insert into usage_monthly_counters (
            clerk_id,
            event_type,
            period_start,
            used,
            reserved
          )
          values ($1, $2, $3, 1, 0)
          on conflict (clerk_id, event_type, period_start)
          do update set
            used = usage_monthly_counters.used + 1,
            updated_at = now()
        `,
        [clerkId, eventType, monthStart],
      );
    }
  });
}

export async function checkLimit(clerkId: string, eventType: UsageEventType): Promise<UsageSnapshot> {
  const { monthStart, resetsAt } = getMonthWindow();

  if (!isDatabaseConfigured()) {
    assertDatabaseConfigured("Usage limits");
  }

  return transaction(async (client) => {
    const tier = await getUserTier(clerkId, client);
    const tierLimit = getLimitForEventType(tier, eventType);

    if (hasUnlimitedAllowance(tierLimit)) {
      return {
        allowed: true,
        current: 0,
        used: 0,
        reserved: 0,
        limit: Number.POSITIVE_INFINITY,
        resetsAt,
        tier,
      };
    }

    await releaseExpiredReservations(client, clerkId, eventType, monthStart);
    const counter = await getCounterSnapshot(client, clerkId, eventType, monthStart);
    const current = counter.used + counter.reserved;
    const limit = tierLimit ?? Number.POSITIVE_INFINITY;

    return {
      allowed: current < limit,
      current,
      used: counter.used,
      reserved: counter.reserved,
      limit,
      resetsAt,
      tier,
    };
  });
}

export async function reserveUsage(
  clerkId: string,
  eventType: UsageEventType,
  options: {
    quantity?: number;
    metadata?: Record<string, unknown>;
    ttlSeconds?: number;
  } = {},
): Promise<UsageReservationResult> {
  const { monthStart, resetsAt } = getMonthWindow();
  const quantity = Math.max(1, Math.floor(options.quantity ?? 1));
  const ttlSeconds = Math.max(30, Math.floor(options.ttlSeconds ?? 10 * 60));

  if (!isDatabaseConfigured()) {
    assertDatabaseConfigured("Usage limits");
  }

  return transaction(async (client) => {
    const tier = await getUserTier(clerkId, client);
    const tierLimit = getLimitForEventType(tier, eventType);

    if (hasUnlimitedAllowance(tierLimit)) {
      return {
        ok: true,
        reservation: {
          id: null,
          clerkId,
          eventType,
          quantity,
          limit: Number.POSITIVE_INFINITY,
          current: 0,
          resetsAt,
          tier,
          metadata: options.metadata ?? {},
        },
      };
    }

    const limit = tierLimit ?? Number.POSITIVE_INFINITY;
    await releaseExpiredReservations(client, clerkId, eventType, monthStart);

    await client.query(
      `
        insert into usage_monthly_counters (
          clerk_id,
          event_type,
          period_start,
          used,
          reserved
        )
        values ($1, $2, $3, 0, 0)
        on conflict (clerk_id, event_type, period_start) do nothing
      `,
      [clerkId, eventType, monthStart],
    );

    const counter = await client.query<UsageCounterRow>(
      `
        update usage_monthly_counters
        set reserved = reserved + $4,
            updated_at = now()
        where clerk_id = $1
          and event_type = $2
          and period_start = $3
          and used + reserved + $4 <= $5
        returning used, reserved
      `,
      [clerkId, eventType, monthStart, quantity, limit],
    );

    if (counter.rowCount === 0) {
      const snapshot = await getCounterSnapshot(client, clerkId, eventType, monthStart);
      const current = snapshot.used + snapshot.reserved;
      return {
        ok: false,
        reason: "limit_reached",
        usage: {
          allowed: false,
          current,
          used: snapshot.used,
          reserved: snapshot.reserved,
          limit,
          resetsAt,
          tier,
        },
      };
    }

    const reservationId = randomUUID();
    await client.query(
      `
        insert into usage_reservations (
          id,
          clerk_id,
          event_type,
          period_start,
          quantity,
          metadata,
          expires_at
        )
        values ($1, $2, $3, $4, $5, $6::jsonb, now() + ($7::text || ' seconds')::interval)
      `,
      [
        reservationId,
        clerkId,
        eventType,
        monthStart,
        quantity,
        JSON.stringify(options.metadata ?? {}),
        ttlSeconds,
      ],
    );

    const row = counter.rows[0];
    const current = Number(row.used) + Number(row.reserved);
    return {
      ok: true,
      reservation: {
        id: reservationId,
        clerkId,
        eventType,
        quantity,
        limit,
        current,
        resetsAt,
        tier,
        metadata: options.metadata ?? {},
      },
    };
  });
}

export async function commitUsageReservation(
  reservation: UsageReservation,
  metadata: Record<string, unknown> = reservation.metadata,
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (!reservation.id) {
    await recordUsage(reservation.clerkId, reservation.eventType, metadata);
    return;
  }

  await transaction(async (client) => {
    const result = await client.query<UsageReservationRow>(
      `
        update usage_reservations
        set status = 'committed',
            metadata = $2::jsonb,
            committed_at = now()
        where id = $1
          and status = 'reserved'
        returning clerk_id, event_type, period_start, quantity
      `,
      [reservation.id, JSON.stringify(metadata)],
    );

    const row = result.rows[0];
    if (!row) {
      return;
    }

    await client.query(
      `
        update usage_monthly_counters
        set reserved = greatest(0, reserved - $4),
            used = used + $4,
            updated_at = now()
        where clerk_id = $1
          and event_type = $2
          and period_start = $3
      `,
      [row.clerk_id, row.event_type, row.period_start, row.quantity],
    );

    await client.query(
      `
        insert into usage_events (
          clerk_id,
          event_type,
          metadata,
          reservation_id,
          quantity
        )
        values ($1, $2, $3::jsonb, $4, $5)
      `,
      [
        row.clerk_id,
        row.event_type,
        JSON.stringify(metadata),
        reservation.id,
        row.quantity,
      ],
    );
  });
}

export async function releaseUsageReservation(reservation: UsageReservation | null | undefined) {
  if (!reservation?.id || !isDatabaseConfigured()) {
    return;
  }

  await transaction(async (client) => {
    const result = await client.query<UsageReservationRow>(
      `
        update usage_reservations
        set status = 'released',
            released_at = now()
        where id = $1
          and status = 'reserved'
        returning clerk_id, event_type, period_start, quantity
      `,
      [reservation.id],
    );

    const row = result.rows[0];
    if (!row) {
      return;
    }

    await client.query(
      `
        update usage_monthly_counters
        set reserved = greatest(0, reserved - $4),
            updated_at = now()
        where clerk_id = $1
          and event_type = $2
          and period_start = $3
      `,
      [row.clerk_id, row.event_type, row.period_start, row.quantity],
    );
  });
}
