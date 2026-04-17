import "server-only";

import { getTierLimits, hasUnlimitedAllowance, type BillingTier } from "@/lib/limits";
import { query } from "@/lib/db";

export type UsageEventType = "message" | "doc_upload" | "course_created";

interface UserTierRow {
  tier: BillingTier | string;
}

interface UsageCountRow {
  current: string;
}

function isBillingTier(value: string): value is BillingTier {
  return value === "free" || value === "pro" || value === "team";
}

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

async function ensureUserRow(clerkId: string) {
  await query(
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

async function getUserTier(clerkId: string): Promise<BillingTier> {
  await ensureUserRow(clerkId);

  const result = await query<UserTierRow>(
    `
      select tier
      from users
      where clerk_id = $1
      limit 1
    `,
    [clerkId],
  );

  const tier = result.rows[0]?.tier;
  return tier && isBillingTier(tier) ? tier : "free";
}

export async function recordUsage(
  clerkId: string,
  eventType: UsageEventType,
  metadata: Record<string, unknown> = {},
) {
  await ensureUserRow(clerkId);

  await query(
    `
      insert into usage_events (
        clerk_id,
        event_type,
        metadata
      )
      values ($1, $2, $3::jsonb)
    `,
    [clerkId, eventType, JSON.stringify(metadata)],
  );
}

export async function checkLimit(clerkId: string, eventType: UsageEventType): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  resetsAt: Date;
}> {
  const { monthStart, resetsAt } = getMonthWindow();
  const tier = await getUserTier(clerkId);
  const tierLimit = getLimitForEventType(tier, eventType);

  const result = await query<UsageCountRow>(
    `
      select count(*)::text as current
      from usage_events
      where clerk_id = $1
        and event_type = $2
        and created_at >= $3
        and created_at < $4
    `,
    [clerkId, eventType, monthStart, resetsAt],
  );

  const current = Number(result.rows[0]?.current ?? "0");
  const allowed = hasUnlimitedAllowance(tierLimit)
    ? true
    : typeof tierLimit === "number" && current < tierLimit;

  return {
    allowed,
    current,
    limit: tierLimit ?? Number.POSITIVE_INFINITY,
    resetsAt,
  };
}
