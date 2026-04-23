import { Pool, type QueryResult, type QueryResultRow } from "pg";

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
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPg.__tutoPgPool = pool;
  }

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, [...params]);
}
