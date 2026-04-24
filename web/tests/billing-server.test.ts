import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createBillingPortalResult,
  createCheckoutSessionResult,
  getBaseUrl,
  getClerkEmailFromSessionClaims,
  hasValidBillingRequestOrigin,
  isBillingTier,
  isCheckoutPlan,
} from '../lib/billing-server'

test('billing helpers validate expected plan and tier values', () => {
  assert.equal(isCheckoutPlan('pro'), true)
  assert.equal(isCheckoutPlan('team'), true)
  assert.equal(isCheckoutPlan('free'), false)

  assert.equal(isBillingTier('free'), true)
  assert.equal(isBillingTier('pro'), true)
  assert.equal(isBillingTier('team'), true)
  assert.equal(isBillingTier('enterprise'), false)
})

test('getBaseUrl prefers configured app URL for billing redirects', () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com/'

  const request = new Request('http://localhost:3000/api/billing/checkout', {
    headers: {
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'attacker.example.com',
    },
  })

  try {
    assert.equal(getBaseUrl(request), 'https://app.example.com')
  } finally {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl
    }
  }
})

test('getBaseUrl requires a configured app URL in production', () => {
  const env = process.env as Record<string, string | undefined>
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL
  const previousNodeEnv = env.NODE_ENV
  delete process.env.NEXT_PUBLIC_APP_URL
  env.NODE_ENV = 'production'

  const request = new Request('http://localhost:3000/api/billing/checkout', {
    headers: {
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'attacker.example.com',
    },
  })

  try {
    assert.throws(
      () => getBaseUrl(request),
      /NEXT_PUBLIC_APP_URL is required for production billing redirects\./
    )
  } finally {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl
    }
    if (previousNodeEnv === undefined) {
      delete env.NODE_ENV
    } else {
      env.NODE_ENV = previousNodeEnv
    }
  }
})

test('getClerkEmailFromSessionClaims extracts known email claim fields', () => {
  assert.equal(getClerkEmailFromSessionClaims({ email: 'hello@example.com' }), 'hello@example.com')
  assert.equal(
    getClerkEmailFromSessionClaims({ email_address: 'fallback@example.com' }),
    'fallback@example.com'
  )
  assert.equal(
    getClerkEmailFromSessionClaims({ primary_email_address: 'primary@example.com' }),
    'primary@example.com'
  )
  assert.equal(
    getClerkEmailFromSessionClaims({
      primaryEmailAddress: { emailAddress: 'nested@example.com' },
    }),
    'nested@example.com'
  )
  assert.equal(
    getClerkEmailFromSessionClaims({
      email_addresses: [{ email_address: 'array@example.com' }],
    }),
    'array@example.com'
  )
  assert.equal(getClerkEmailFromSessionClaims({ foo: 'bar' }), null)
})

test('hasValidBillingRequestOrigin rejects mismatched origins', () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'

  try {
    assert.equal(
      hasValidBillingRequestOrigin(
        new Request('https://app.example.com/api/billing/checkout', {
          method: 'POST',
          headers: { origin: 'https://app.example.com' },
        })
      ),
      true
    )
    assert.equal(
      hasValidBillingRequestOrigin(
        new Request('https://app.example.com/api/billing/checkout', {
          method: 'POST',
          headers: { origin: 'https://evil.example.com' },
        })
      ),
      false
    )
  } finally {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl
    }
  }
})

test('createCheckoutSessionResult returns manage hint for paid users', async () => {
  const request = new Request('http://localhost:3000/api/billing/checkout', {
    method: 'POST',
  })

  const result = await createCheckoutSessionResult({
    request,
    userId: 'user_paid',
    sessionClaims: { email: 'paid@example.com' },
    payload: { plan: 'pro' },
    deps: {
      isDatabaseConfigured: () => true,
      getBillingSummary: async () => ({
        billingEnabled: true,
        tier: 'pro',
        stripeCustomerId: 'cus_paid',
        subscriptionStatus: 'active',
        currentPeriodEnd: null,
      }),
    },
  })

  assert.equal(result.status, 409)
  assert.equal(result.body.manage_url, '/api/billing/portal')
})

test('createCheckoutSessionResult creates a Stripe checkout session for free users', async () => {
  const request = new Request('http://localhost:3000/api/billing/checkout', {
    method: 'POST',
    headers: { origin: 'http://localhost:3000' },
  })

  let createCall: Record<string, unknown> | null = null

  const result = await createCheckoutSessionResult({
    request,
    userId: 'user_free',
    sessionClaims: { email: 'free@example.com' },
    payload: { plan: 'pro' },
    deps: {
      isDatabaseConfigured: () => true,
      getBillingSummary: async () => ({
        billingEnabled: true,
        tier: 'free',
        stripeCustomerId: null,
        subscriptionStatus: 'inactive',
        currentPeriodEnd: null,
      }),
      getPriceIdForPlan: () => 'price_test_pro',
      createOrReuseCustomer: async () => 'cus_123',
      getStripeServerClient: () =>
        ({
          checkout: {
            sessions: {
              create: async (input: Record<string, unknown>) => {
                createCall = input
                return { url: 'https://checkout.stripe.test/session_123' }
              },
            },
          },
        }) as never,
    },
  })

  assert.equal(result.status, 200)
  assert.equal(result.body.url, 'https://checkout.stripe.test/session_123')
  assert.equal(createCall?.['customer'], 'cus_123')
  assert.equal(createCall?.['success_url'], 'http://localhost:3000/dashboard?billing=success')
})

test('createBillingPortalResult returns a portal session for paid users', async () => {
  const request = new Request('http://localhost:3000/api/billing/portal', {
    method: 'POST',
  })

  let portalCall: Record<string, unknown> | null = null

  const result = await createBillingPortalResult({
    request,
    userId: 'user_paid',
    deps: {
      isDatabaseConfigured: () => true,
      getBillingSummary: async () => ({
        billingEnabled: true,
        tier: 'pro',
        stripeCustomerId: 'cus_paid',
        subscriptionStatus: 'active',
        currentPeriodEnd: '2026-05-01T00:00:00.000Z',
      }),
      getStripeServerClient: () =>
        ({
          billingPortal: {
            sessions: {
              create: async (input: Record<string, unknown>) => {
                portalCall = input
                return { url: 'https://billing.stripe.test/session_123' }
              },
            },
          },
        }) as never,
    },
  })

  assert.equal(result.status, 200)
  assert.equal(result.body.url, 'https://billing.stripe.test/session_123')
  assert.deepEqual(portalCall, {
    customer: 'cus_paid',
    return_url: 'http://localhost:3000/pricing',
  })
})

test('createBillingPortalResult rejects free users', async () => {
  const request = new Request('http://localhost:3000/api/billing/portal', {
    method: 'POST',
  })

  const result = await createBillingPortalResult({
    request,
    userId: 'user_free',
    deps: {
      isDatabaseConfigured: () => true,
      getBillingSummary: async () => ({
        billingEnabled: true,
        tier: 'free',
        stripeCustomerId: null,
        subscriptionStatus: 'inactive',
        currentPeriodEnd: null,
      }),
    },
  })

  assert.equal(result.status, 409)
  assert.equal(result.body.error, 'No active paid subscription is available to manage.')
})
