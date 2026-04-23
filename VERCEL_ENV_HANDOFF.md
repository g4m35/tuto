# Vercel Env Handoff

This note covers the web app launch env required by the current code in `/Users/jheller/Desktop/tuto/tuto/web`.

It is grouped by provider and marks whether each variable is already present in local env files (`/Users/jheller/Desktop/tuto/tuto/.env`, `/Users/jheller/Desktop/tuto/tuto/web/.env.local`) or still missing for a real Vercel deploy.

Secret values are intentionally omitted.

## Clerk

Required for launch:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - Used by the web app for Clerk client auth.
  - Local status: present
  - Vercel status: must be set in Vercel
- `CLERK_SECRET_KEY`
  - Used by Clerk server middleware and authenticated server routes.
  - Local status: present
  - Vercel status: must be set in Vercel
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
  - Used by Clerk auth flow routing.
  - Local status: present
  - Vercel status: must be set in Vercel
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
  - Used by Clerk auth flow routing.
  - Local status: present
  - Vercel status: must be set in Vercel
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
  - Used after sign-in completion.
  - Local status: present
  - Vercel status: must be set in Vercel
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
  - Used after sign-up completion.
  - Local status: present
  - Vercel status: must be set in Vercel

Optional but currently documented locally:

- `NEXT_PUBLIC_CLERK_KEYLESS_DISABLED`
  - Present in local web env and `web/.env.example`.
  - Local status: present
  - Vercel status: recommended to set to match local behavior

## Stripe

Required for paid launch:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Required by `web/lib/billing.ts` for Stripe.js.
  - Local status: missing
  - Vercel status: must be set in Vercel
- `STRIPE_SECRET_KEY`
  - Required by `web/lib/billing.ts` for server-side Stripe calls.
  - Local status: missing
  - Vercel status: must be set in Vercel
- `STRIPE_WEBHOOK_SECRET`
  - Required by `web/app/api/webhooks/stripe/route.ts` for signature verification.
  - Local status: missing
  - Vercel status: must be set in Vercel
- `STRIPE_PRO_PRICE_ID`
  - Required by billing/webhook tier mapping.
  - Local status: missing
  - Vercel status: must be set in Vercel
- `STRIPE_TEAM_PRICE_ID`
  - Required by billing/webhook tier mapping.
  - Local status: missing
  - Vercel status: must be set in Vercel

## Database

Required for launch:

- `DATABASE_URL`
  - Primary Postgres connection string used by `web/lib/db.ts`.
  - Local status: missing
  - Vercel status: must be set in Vercel

Supported fallback:

- `POSTGRES_URL`
  - Alternate Postgres connection string; code accepts this if `DATABASE_URL` is not set.
  - Local status: missing
  - Vercel status: optional fallback only

Recommendation:

- Set `DATABASE_URL` explicitly and do not rely on the fallback.

## Backend

Required for launch:

- `DEEPTUTOR_URL`
  - Used by `web/lib/deeptutor.ts` and health routes for backend API calls.
  - Local status: present in `web/.env.local`
  - Vercel status: must be set in Vercel to the hosted backend URL
- `NEXT_PUBLIC_API_BASE`
  - Used by browser-side API base resolution and Playwright config.
  - Local status: present in `.env` and `web/.env.local`
  - Vercel status: should be set in Vercel to the same hosted backend base

Optional depending on backend protection:

- `DEEPTUTOR_API_KEY`
  - Used only if the hosted DeepTutor backend requires Authorization / `X-API-Key`.
  - Local status: missing
  - Vercel status: set only if the backend is behind a gateway or proxy that requires it

## Local Inventory Summary

Already present locally:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_KEYLESS_DISABLED`
- `DEEPTUTOR_URL`
- `NEXT_PUBLIC_API_BASE`

Missing locally for a real paid deploy:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_TEAM_PRICE_ID`
- `DATABASE_URL`
- `POSTGRES_URL`
- `DEEPTUTOR_API_KEY` (only if backend auth is enabled)

## Suggested Vercel Setup Order

1. Add all Clerk variables.
2. Add `DATABASE_URL`.
3. Add `DEEPTUTOR_URL` and `NEXT_PUBLIC_API_BASE`.
4. Add all Stripe variables.
5. If the backend is protected, add `DEEPTUTOR_API_KEY`.
6. Redeploy and then point Stripe webhooks at `/api/webhooks/stripe`.
