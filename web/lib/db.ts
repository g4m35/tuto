import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

type GlobalWithPgPool = typeof globalThis & {
  __tutoPgPool?: Pool;
};

let pool: Pool | null = null;

export class DatabaseConfigurationError extends Error {
  constructor(feature: string) {
    super(`${feature} requires a configured database.`);
    this.name = "DatabaseConfigurationError";
  }
}

export function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? null;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function canUseEphemeralDatabaseFallback(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function assertDatabaseConfigured(feature: string): void {
  if (!isDatabaseConfigured()) {
    throw new DatabaseConfigurationError(feature);
  }
}

function getPoolMax() {
  const configured = Number(process.env.DATABASE_POOL_MAX ?? process.env.PGPOOL_MAX);
  return Number.isFinite(configured) && configured > 0 ? configured : 5;
}

function getStatementTimeoutMillis() {
  const configured = Number(process.env.DATABASE_STATEMENT_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : 15_000;
}

function shouldUseSsl(connectionString: string) {
  const sslMode = new URL(connectionString).searchParams.get("sslmode") ?? process.env.PGSSLMODE;
  if (sslMode === "disable") {
    return false;
  }

  return sslMode === "require" || process.env.DATABASE_SSL === "true";
}

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const globalForPg = globalThis as GlobalWithPgPool;
  if (globalForPg.__tutoPgPool) {
    pool = globalForPg.__tutoPgPool;
    return pool;
  }

  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new DatabaseConfigurationError("Database access");
  }

  pool = new Pool({
    connectionString,
    max: getPoolMax(),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    statement_timeout: getStatementTimeoutMillis(),
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  });

  globalForPg.__tutoPgPool = pool;

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, [...params]);
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
