import "server-only";

import { Pool, type QueryResult, type QueryResultRow } from "pg";

type GlobalWithPgPool = typeof globalThis & {
  __tutoPgPool?: Pool;
};

let pool: Pool | null = null;

export function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? null;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
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
    throw new Error("Missing required Postgres environment variable: DATABASE_URL or POSTGRES_URL");
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
