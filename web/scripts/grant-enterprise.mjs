#!/usr/bin/env node

import pg from "pg";

const { Pool } = pg;

function readArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : "";
}

function usage() {
  console.error(
    "Usage: node scripts/grant-enterprise.mjs --clerk-id=user_123 [--stripe-customer-id=cus_123]",
  );
}

const clerkId = readArg("clerk-id");
const stripeCustomerId = readArg("stripe-customer-id") || null;
const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";

if (!clerkId) {
  usage();
  process.exit(1);
}

if (!databaseUrl) {
  console.error("DATABASE_URL or POSTGRES_URL is required.");
  process.exit(1);
}

const sslMode = new URL(databaseUrl).searchParams.get("sslmode") ?? process.env.PGSSLMODE;
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslMode === "disable" ? undefined : { rejectUnauthorized: false },
});

try {
  await pool.query(
    `
      insert into users (
        clerk_id,
        stripe_customer_id,
        tier,
        subscription_status,
        updated_at
      )
      values ($1, $2, 'enterprise', 'contracted', now())
      on conflict (clerk_id) do update
      set
        stripe_customer_id = coalesce($2, users.stripe_customer_id),
        tier = 'enterprise',
        subscription_status = 'contracted',
        current_period_end = null,
        updated_at = now()
    `,
    [clerkId, stripeCustomerId],
  );
  console.log(`Granted enterprise access to ${clerkId}.`);
} finally {
  await pool.end();
}
