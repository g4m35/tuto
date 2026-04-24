import { query, isDatabaseConfigured } from '@/lib/db'
import {
  getStripeProPriceId,
  getStripeServerClient,
  getStripeTeamPriceId,
  isStripeCheckoutConfigured,
  isStripePortalConfigured,
} from '@/lib/billing'
import type { BillingTier } from '@/lib/limits'

export interface UserBillingRow {
  clerk_id: string
  stripe_customer_id: string | null
  tier: BillingTier | string
  subscription_status?: string | null
  current_period_end?: Date | string | null
}

export interface BillingSummary {
  billingEnabled: boolean
  tier: BillingTier
  stripeCustomerId: string | null
  subscriptionStatus: string | null
  currentPeriodEnd: string | null
}

interface CheckoutResultBody {
  url?: string
  error?: string
  manage_url?: string
}

export type CheckoutPlan = 'pro' | 'team'

export function isCheckoutPlan(value: string): value is CheckoutPlan {
  return value === 'pro' || value === 'team'
}

export function isBillingTier(value: string): value is BillingTier {
  return value === 'free' || value === 'pro' || value === 'team'
}

export function getPriceIdForPlan(plan: CheckoutPlan) {
  return plan === 'team' ? getStripeTeamPriceId() : getStripeProPriceId()
}

export function isLaunchReadyCheckoutPlan(plan: CheckoutPlan) {
  return plan === 'pro'
}

export function getBaseUrl(request: Request) {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (configuredAppUrl) {
    return configuredAppUrl
  }

  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  const vercelUrl = process.env.VERCEL_URL?.replace(/\/$/, '')
  if (vercelUrl) {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    return `${protocol}://${vercelUrl}`
  }

  const origin = request.headers.get('origin')
  if (origin) {
    return origin
  }

  return new URL(request.url).origin
}

function getHeaderOrigin(value: string | null): string | null {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function hasValidBillingRequestOrigin(request: Request) {
  const expectedOrigin = new URL(getBaseUrl(request)).origin
  const suppliedOrigin =
    getHeaderOrigin(request.headers.get('origin')) ??
    getHeaderOrigin(request.headers.get('referer'))

  if (!suppliedOrigin) {
    return process.env.NODE_ENV !== 'production'
  }

  return suppliedOrigin === expectedOrigin
}

function normalizeCurrentPeriodEnd(value: Date | string | null | undefined) {
  if (!value) {
    return null
  }

  return typeof value === 'string' ? value : value.toISOString()
}

export async function ensureUserRow(clerkId: string) {
  if (!isDatabaseConfigured()) {
    return
  }

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
    [clerkId]
  )
}

export async function getUserBillingRow(clerkId: string): Promise<UserBillingRow | null> {
  if (!isDatabaseConfigured()) {
    return null
  }

  await ensureUserRow(clerkId)

  const result = await query<UserBillingRow>(
    `
      select clerk_id, stripe_customer_id, tier, subscription_status, current_period_end
      from users
      where clerk_id = $1
      limit 1
    `,
    [clerkId]
  )

  return result.rows[0] ?? null
}

export async function getBillingSummary(clerkId: string): Promise<BillingSummary> {
  const row = await getUserBillingRow(clerkId)
  const tier = row?.tier

  return {
    billingEnabled: isDatabaseConfigured(),
    tier: tier && isBillingTier(tier) ? tier : 'free',
    stripeCustomerId: row?.stripe_customer_id ?? null,
    subscriptionStatus: row?.subscription_status ?? null,
    currentPeriodEnd: normalizeCurrentPeriodEnd(row?.current_period_end),
  }
}

export async function createOrReuseCustomer(input: {
  clerkId: string
  email: string | null
  existingCustomerId: string | null
}) {
  if (!isDatabaseConfigured()) {
    throw new Error('Billing requires a configured database.')
  }

  if (input.existingCustomerId) {
    return input.existingCustomerId
  }

  const customer = await getStripeServerClient().customers.create({
    email: input.email ?? undefined,
    metadata: {
      clerkId: input.clerkId,
    },
  })

  await query(
    `
      update users
      set stripe_customer_id = $2, updated_at = now()
      where clerk_id = $1
    `,
    [input.clerkId, customer.id]
  )

  return customer.id
}

export function getClerkEmailFromSessionClaims(sessionClaims: unknown) {
  if (!sessionClaims || typeof sessionClaims !== 'object') {
    return null
  }

  const claims = sessionClaims as Record<string, unknown>
  const candidates = [
    claims.email,
    claims.email_address,
    claims.primary_email_address,
    typeof claims.primaryEmailAddress === 'object' && claims.primaryEmailAddress
      ? (claims.primaryEmailAddress as Record<string, unknown>).emailAddress
      : null,
    Array.isArray(claims.email_addresses)
      ? (claims.email_addresses[0] as Record<string, unknown> | undefined)?.email_address
      : null,
    Array.isArray(claims.emailAddresses)
      ? (claims.emailAddresses[0] as Record<string, unknown> | undefined)?.emailAddress
      : null,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }

  return null
}

type CheckoutDependencies = {
  isDatabaseConfigured: typeof isDatabaseConfigured
  isStripeCheckoutConfigured: typeof isStripeCheckoutConfigured
  isCheckoutPlan: typeof isCheckoutPlan
  isLaunchReadyCheckoutPlan: typeof isLaunchReadyCheckoutPlan
  getBillingSummary: typeof getBillingSummary
  getClerkEmailFromSessionClaims: typeof getClerkEmailFromSessionClaims
  createOrReuseCustomer: typeof createOrReuseCustomer
  getStripeServerClient: typeof getStripeServerClient
  getBaseUrl: typeof getBaseUrl
  hasValidBillingRequestOrigin: typeof hasValidBillingRequestOrigin
  getPriceIdForPlan: typeof getPriceIdForPlan
}

export async function createCheckoutSessionResult(input: {
  request: Request
  userId: string
  sessionClaims: unknown
  payload: unknown
  deps?: Partial<CheckoutDependencies>
}): Promise<{ status: number; body: CheckoutResultBody }> {
  const deps: CheckoutDependencies = {
    isDatabaseConfigured,
    isStripeCheckoutConfigured,
    isCheckoutPlan,
    isLaunchReadyCheckoutPlan,
    getBillingSummary,
    getClerkEmailFromSessionClaims,
    createOrReuseCustomer,
    getStripeServerClient,
    getBaseUrl,
    hasValidBillingRequestOrigin,
    getPriceIdForPlan,
    ...input.deps,
  }

  if (!deps.hasValidBillingRequestOrigin(input.request)) {
    return { status: 403, body: { error: 'Invalid billing request origin.' } }
  }

  if (!deps.isDatabaseConfigured()) {
    return {
      status: 503,
      body: { error: 'Billing is unavailable until the database is configured.' },
    }
  }

  if (!deps.isStripeCheckoutConfigured()) {
    return {
      status: 503,
      body: { error: 'Billing checkout is unavailable until Stripe is configured.' },
    }
  }

  const plan =
    typeof input.payload === 'object' && input.payload && 'plan' in input.payload
      ? String(input.payload.plan)
      : ''
  if (!deps.isCheckoutPlan(plan)) {
    return { status: 400, body: { error: 'Invalid billing plan.' } }
  }

  if (!deps.isLaunchReadyCheckoutPlan(plan)) {
    return {
      status: 409,
      body: { error: 'Team billing is not publicly available yet. Start with Pro for now.' },
    }
  }

  const billingSummary = await deps.getBillingSummary(input.userId)
  if (billingSummary.tier !== 'free') {
    return {
      status: 409,
      body: {
        error: 'You already have an active paid tier. Use billing management instead.',
        manage_url: '/api/billing/portal',
      },
    }
  }

  const stripeCustomerId = await deps.createOrReuseCustomer({
    clerkId: input.userId,
    email: deps.getClerkEmailFromSessionClaims(input.sessionClaims),
    existingCustomerId: billingSummary.stripeCustomerId,
  })

  const session = await deps.getStripeServerClient().checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [
      {
        price: deps.getPriceIdForPlan(plan),
        quantity: 1,
      },
    ],
    success_url: `${deps.getBaseUrl(input.request)}/dashboard?billing=success`,
    cancel_url: `${deps.getBaseUrl(input.request)}/pricing?billing=canceled`,
    client_reference_id: input.userId,
    allow_promotion_codes: true,
    metadata: {
      clerkId: input.userId,
      plan,
    },
  })

  return {
    status: 200,
    body: {
      url: session.url ?? undefined,
    },
  }
}

type PortalDependencies = {
  isDatabaseConfigured: typeof isDatabaseConfigured
  isStripePortalConfigured: typeof isStripePortalConfigured
  getBillingSummary: typeof getBillingSummary
  getStripeServerClient: typeof getStripeServerClient
  getBaseUrl: typeof getBaseUrl
  hasValidBillingRequestOrigin: typeof hasValidBillingRequestOrigin
}

export async function createBillingPortalResult(input: {
  request: Request
  userId: string
  deps?: Partial<PortalDependencies>
}): Promise<{ status: number; body: CheckoutResultBody }> {
  const deps: PortalDependencies = {
    isDatabaseConfigured,
    isStripePortalConfigured,
    getBillingSummary,
    getStripeServerClient,
    getBaseUrl,
    hasValidBillingRequestOrigin,
    ...input.deps,
  }

  if (!deps.hasValidBillingRequestOrigin(input.request)) {
    return { status: 403, body: { error: 'Invalid billing request origin.' } }
  }

  if (!deps.isDatabaseConfigured()) {
    return {
      status: 503,
      body: { error: 'Billing is unavailable until the database is configured.' },
    }
  }

  if (!deps.isStripePortalConfigured()) {
    return {
      status: 503,
      body: { error: 'Billing portal is unavailable until Stripe is configured.' },
    }
  }

  const billingSummary = await deps.getBillingSummary(input.userId)
  if (billingSummary.tier === 'free' || !billingSummary.stripeCustomerId) {
    return {
      status: 409,
      body: { error: 'No active paid subscription is available to manage.' },
    }
  }

  const session = await deps.getStripeServerClient().billingPortal.sessions.create({
    customer: billingSummary.stripeCustomerId,
    return_url: `${deps.getBaseUrl(input.request)}/pricing`,
  })

  return {
    status: 200,
    body: {
      url: session.url ?? undefined,
    },
  }
}
