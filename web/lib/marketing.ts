import { isDatabaseConfigured, query } from "@/lib/db";

export interface MarketingEventInput {
  name: string;
  distinctId: string;
  userId?: string | null;
  source?: string | null;
  url?: string | null;
  referrer?: string | null;
  properties?: Record<string, unknown>;
}

export interface BetaSignupInput {
  email: string;
  name?: string | null;
  useCase?: string | null;
  materialType?: string | null;
  notes?: string | null;
  marketingOptIn?: boolean;
  source?: string | null;
  metadata?: Record<string, unknown>;
}

function trimString(value: string | null | undefined, maxLength: number) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, maxLength);
}

function getPostHogConfig() {
  const apiKey =
    process.env.POSTHOG_PROJECT_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ||
    "";
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

  return apiKey ? { apiKey, host } : null;
}

export function isMarketingEventForwardingConfigured() {
  return Boolean(getPostHogConfig());
}

export function isBetaSignupSinkConfigured() {
  return isDatabaseConfigured() || Boolean(process.env.BETA_SIGNUP_WEBHOOK_URL?.trim());
}

function normalizeProperties(properties: Record<string, unknown> | undefined) {
  return JSON.parse(JSON.stringify(properties ?? {})) as Record<string, unknown>;
}

async function capturePostHogEvent(input: MarketingEventInput) {
  const config = getPostHogConfig();
  if (!config) {
    return;
  }

  await fetch(`${config.host.replace(/\/$/, "")}/capture/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: config.apiKey,
      event: input.name,
      distinct_id: input.distinctId,
      properties: {
        ...(input.properties ?? {}),
        source: input.source ?? undefined,
        url: input.url ?? undefined,
        referrer: input.referrer ?? undefined,
        user_id: input.userId ?? undefined,
      },
    }),
  });
}

async function storeMarketingEvent(input: MarketingEventInput) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await query(
    `
      insert into marketing_events (
        name,
        distinct_id,
        user_id,
        source,
        url,
        referrer,
        properties
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
    [
      trimString(input.name, 120),
      trimString(input.distinctId, 160),
      trimString(input.userId, 160),
      trimString(input.source, 120),
      trimString(input.url, 600),
      trimString(input.referrer, 600),
      JSON.stringify(normalizeProperties(input.properties)),
    ],
  );
}

export async function captureMarketingEvent(input: MarketingEventInput) {
  const name = trimString(input.name, 120);
  const distinctId = trimString(input.distinctId, 160);

  if (!name || !distinctId) {
    return { accepted: false, stored: false, forwarded: false };
  }

  const normalizedInput = {
    ...input,
    name,
    distinctId,
    properties: normalizeProperties(input.properties),
  };

  const results = await Promise.allSettled([
    storeMarketingEvent(normalizedInput),
    capturePostHogEvent(normalizedInput),
  ]);

  return {
    accepted: true,
    stored: results[0].status === "fulfilled" && isDatabaseConfigured(),
    forwarded: results[1].status === "fulfilled" && isMarketingEventForwardingConfigured(),
  };
}

async function sendBetaSignupWebhook(input: BetaSignupInput) {
  const webhookUrl = process.env.BETA_SIGNUP_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return;
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.BETA_SIGNUP_WEBHOOK_SECRET
        ? { Authorization: `Bearer ${process.env.BETA_SIGNUP_WEBHOOK_SECRET}` }
        : {}),
    },
    body: JSON.stringify({
      ...input,
      submitted_at: new Date().toISOString(),
    }),
  });
}

async function storeBetaSignup(input: BetaSignupInput) {
  if (!isDatabaseConfigured()) {
    return;
  }

  const email = trimString(input.email, 320);
  if (!email) {
    throw new Error("Email is required.");
  }

  await query(
    `
      insert into beta_signups (
        email,
        email_normalized,
        name,
        use_case,
        material_type,
        notes,
        marketing_opt_in,
        source,
        metadata
      )
      values ($1, lower($1), $2, $3, $4, $5, $6, $7, $8::jsonb)
      on conflict (email_normalized)
      do update set
        email = excluded.email,
        name = coalesce(excluded.name, beta_signups.name),
        use_case = coalesce(excluded.use_case, beta_signups.use_case),
        material_type = coalesce(excluded.material_type, beta_signups.material_type),
        notes = coalesce(excluded.notes, beta_signups.notes),
        marketing_opt_in = excluded.marketing_opt_in or beta_signups.marketing_opt_in,
        source = coalesce(excluded.source, beta_signups.source),
        metadata = beta_signups.metadata || excluded.metadata,
        updated_at = now()
    `,
    [
      email,
      trimString(input.name, 160),
      trimString(input.useCase, 120),
      trimString(input.materialType, 120),
      trimString(input.notes, 1000),
      Boolean(input.marketingOptIn),
      trimString(input.source, 120),
      JSON.stringify(normalizeProperties(input.metadata)),
    ],
  );
}

export async function recordBetaSignup(input: BetaSignupInput) {
  const email = trimString(input.email, 320);
  if (!email) {
    return { accepted: false, stored: false, forwarded: false };
  }

  const normalizedInput = {
    ...input,
    email,
    metadata: normalizeProperties(input.metadata),
  };

  const results = await Promise.allSettled([
    storeBetaSignup(normalizedInput),
    sendBetaSignupWebhook(normalizedInput),
    captureMarketingEvent({
      name: "beta_signup_submitted",
      distinctId: email.toLowerCase(),
      source: input.source ?? "landing_page",
      properties: {
        use_case: input.useCase,
        material_type: input.materialType,
        marketing_opt_in: Boolean(input.marketingOptIn),
      },
    }),
  ]);

  return {
    accepted: true,
    stored: results[0].status === "fulfilled" && isDatabaseConfigured(),
    forwarded: results[1].status === "fulfilled" && Boolean(process.env.BETA_SIGNUP_WEBHOOK_URL),
  };
}
