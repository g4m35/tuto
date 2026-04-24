# Production Launch Runbook

## Required hosted configuration

- Create a web deployment from the `web/` directory.
- Use Node 24.x for install, build, and runtime. The repo includes `web/.nvmrc` and `web/package.json` engines for this.
- Set preview and production env vars:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true`
  - `DATABASE_URL` or `POSTGRES_URL`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRO_PRICE_ID`
  - `STRIPE_TEAM_PRICE_ID`
  - `DEEPTUTOR_URL`
  - `DEEPTUTOR_API_KEY`
- In Clerk, bind the deployed domain and set sign-in/sign-up redirects to `/dashboard`
- In Stripe, point the webhook endpoint to `/api/webhooks/stripe`
- Apply `web/migrations/*.sql` to the hosted Postgres database

## Local verification before deploy

```bash
cd web
nvm use
npm ci
npm run typecheck
npm run test:node
npm run build
```

## Railway web deployment notes

- `web/railway.toml` uses Railpack and starts the Next standalone server.
- Railway should run from the `web/` directory so `npm ci`, `npm run build`, and `.next/standalone/server.js` resolve correctly.
- Keep `DATABASE_URL` or `POSTGRES_URL` on the web service, not only on the backend service.

## Fail-closed production checks

- If `DATABASE_URL` or `POSTGRES_URL` is missing in production, `/api/courses` and usage-limited APIs return `database_not_configured`.
- If Stripe sends a subscription event with an unknown recurring price ID, webhook processing returns a 500 so the delivery can be retried after configuration is corrected.

## Launch smoke checks

- Visit `/pricing` signed out and confirm it loads publicly
- Visit `/dashboard` signed out and confirm Clerk redirects to `/sign-in`
- Sign in and confirm `/pricing` shows the current tier and usage context
- Submit `Pro` checkout from `/pricing` and confirm Stripe Checkout opens
- Complete a test payment and confirm the webhook updates the `users` row
- Return to `/pricing` and confirm tier/subscription state changed
- Open “Manage subscription” and confirm the Stripe billing portal opens

## Billing support checks

- Support inbox is `support@tuto.app`
- Refund terms live at `/refund-policy`
- Terms live at `/terms`
- Privacy policy lives at `/privacy`

## Database verification query

```sql
select clerk_id, stripe_customer_id, tier, subscription_status, current_period_end
from users
order by updated_at desc
limit 20;
```
