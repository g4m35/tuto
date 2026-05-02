import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
} as NodeJS.Module;

async function importFresh<T>(specifier: string): Promise<T> {
  return import(`${specifier}?t=${Date.now()}-${Math.random()}`) as Promise<T>;
}

test("usage reservations allow local development without a database", async () => {
  const env = process.env as Record<string, string | undefined>;
  const previousNodeEnv = env.NODE_ENV;
  const previousDatabaseUrl = env.DATABASE_URL;
  const previousPostgresUrl = env.POSTGRES_URL;

  env.NODE_ENV = "development";
  delete env.DATABASE_URL;
  delete env.POSTGRES_URL;

  try {
    const usage = await importFresh<typeof import("../lib/usage")>("../lib/usage");

    const reserved = await usage.reserveUsage("user-local", "message", {
      metadata: { courseId: "course-local" },
    });
    const snapshot = await usage.checkLimit("user-local", "message");

    assert.equal(reserved.ok, true);
    if (reserved.ok) {
      assert.equal(reserved.reservation.id, null);
      assert.equal(reserved.reservation.current, 0);
      assert.equal(reserved.reservation.tier, "free");
      assert.equal(reserved.reservation.metadata.courseId, "course-local");
    }
    assert.equal(snapshot.allowed, true);
    assert.equal(snapshot.current, 0);
    assert.equal(snapshot.tier, "free");
  } finally {
    env.NODE_ENV = previousNodeEnv;
    if (previousDatabaseUrl === undefined) {
      delete env.DATABASE_URL;
    } else {
      env.DATABASE_URL = previousDatabaseUrl;
    }
    if (previousPostgresUrl === undefined) {
      delete env.POSTGRES_URL;
    } else {
      env.POSTGRES_URL = previousPostgresUrl;
    }
  }
});

test("usage reservations still fail closed in production without a database", async () => {
  const env = process.env as Record<string, string | undefined>;
  const previousNodeEnv = env.NODE_ENV;
  const previousDatabaseUrl = env.DATABASE_URL;
  const previousPostgresUrl = env.POSTGRES_URL;

  env.NODE_ENV = "production";
  delete env.DATABASE_URL;
  delete env.POSTGRES_URL;

  try {
    const usage = await importFresh<typeof import("../lib/usage")>("../lib/usage");

    await assert.rejects(
      () => usage.reserveUsage("user-prod", "message"),
      /Usage limits requires a configured database\./,
    );
  } finally {
    env.NODE_ENV = previousNodeEnv;
    if (previousDatabaseUrl === undefined) {
      delete env.DATABASE_URL;
    } else {
      env.DATABASE_URL = previousDatabaseUrl;
    }
    if (previousPostgresUrl === undefined) {
      delete env.POSTGRES_URL;
    } else {
      env.POSTGRES_URL = previousPostgresUrl;
    }
  }
});
