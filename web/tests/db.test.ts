import test from 'node:test'
import assert from 'node:assert/strict'
import { getDatabaseSslConfig } from '../lib/db'

function withEnv(updates: Record<string, string | undefined>, callback: () => void) {
  const previous = new Map<string, string | undefined>()
  for (const key of Object.keys(updates)) {
    previous.set(key, process.env[key])
    const value = updates[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  try {
    callback()
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

test('database SSL validates server certificates by default when SSL is enabled', () => {
  withEnv(
    {
      DATABASE_SSL: 'true',
      DATABASE_SSL_REJECT_UNAUTHORIZED: undefined,
      PGSSLREJECTUNAUTHORIZED: undefined,
      PGSSLMODE: undefined,
    },
    () => {
      assert.deepEqual(getDatabaseSslConfig('postgres://user:pass@db.example.com/app'), {
        rejectUnauthorized: true,
      })
    }
  )
})

test('database SSL allows an explicit certificate-validation opt-out', () => {
  withEnv(
    {
      DATABASE_SSL: 'true',
      DATABASE_SSL_REJECT_UNAUTHORIZED: 'false',
      PGSSLREJECTUNAUTHORIZED: undefined,
      PGSSLMODE: undefined,
    },
    () => {
      assert.deepEqual(getDatabaseSslConfig('postgres://user:pass@db.example.com/app'), {
        rejectUnauthorized: false,
      })
    }
  )
})

test('database SSL remains disabled when sslmode=disable is configured', () => {
  withEnv(
    {
      DATABASE_SSL: 'true',
      DATABASE_SSL_REJECT_UNAUTHORIZED: undefined,
      PGSSLREJECTUNAUTHORIZED: undefined,
      PGSSLMODE: undefined,
    },
    () => {
      assert.equal(
        getDatabaseSslConfig('postgres://user:pass@db.example.com/app?sslmode=disable'),
        undefined
      )
    }
  )
})
