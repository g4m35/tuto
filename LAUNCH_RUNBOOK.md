# Launch Runbook

## Paid launch slice

Ship one narrow path first:

- Clerk-authenticated user
- Create a course
- Hit a usage limit cleanly
- Upgrade through Stripe
- Let the Stripe webhook update the tier
- Retry the course flow without manual intervention

Everything in this runbook is scoped to that path.

## Required environment

### Web app

- `DEEPTUTOR_URL`
- `NEXT_PUBLIC_API_BASE`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_KEYLESS_DISABLED`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `DATABASE_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_TEAM_PRICE_ID`

### Operational checks

- Clerk production instance points to the live domain
- Stripe webhook target points to `/api/webhooks/stripe`
- Postgres migrations in `web/migrations/` have been applied
- Stripe price ids match the intended launch plans

## Pre-launch verification

Run these before opening payments:

```bash
cd /Users/jheller/Desktop/tuto/tuto/web
node --test tests/billing.test.ts
npm exec eslint -- lib/billing.ts app/api/billing/_lib.ts app/api/billing/checkout/route.ts app/api/billing/portal/route.ts app/pricing/page.tsx components/ui/TopNav.tsx 'app/(app)/create/page.tsx' tests/billing.test.ts
npm run build
```

Confirm these manually in staging:

- Signed-out visitor can open `/pricing`
- Signed-in user sees current tier, subscription state, and monthly usage context on `/pricing`
- Signed-in free user can reach checkout from `/pricing`
- Limit hit in `/create` redirects to `/pricing?reason=limit`
- Successful Stripe checkout returns to `/pricing?checkout=success`
- Stripe webhook updates `users.tier` from `free` to `pro` or `team`
- Existing paid user can open the billing portal
- `/pricing` stays honest when the database is unavailable and does not pretend usage state is known

## Deployment steps

1. Apply the latest web migrations.
2. Deploy the backend and web app with the environment above.
3. Verify `/pricing`, `/create`, and `/api/webhooks/stripe` health after deploy.
4. Perform one staging checkout using live-like Stripe test data.
5. Confirm the webhook updates the `users` row within a few minutes.

## Rollback plan

If billing is broken:

1. Disable upgrade traffic by removing pricing CTA access or setting Stripe products inactive.
2. Roll back the web deploy to the previous healthy release.
3. Replay failed Stripe webhook events after the fix is deployed.
4. Audit `users.tier`, `subscription_status`, and `current_period_end` for affected customers.

## Support queue

Prepare these before charging users:

- Billing support email or contact path
- Refund policy
- Terms and privacy policy
- A way to inspect `users` billing state for support requests
- A way for support to confirm monthly usage counts when a user says a limit was hit too early

## Remaining launch blockers

- Decide and publish the actual plan prices in customer-facing copy
- Add an end-to-end checkout test against staging Stripe keys
- Define the first-response support workflow for failed payments and webhook delays
- Decide whether monthly reset dates should be shown in UTC only or localized per user
