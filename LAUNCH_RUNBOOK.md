# Vercel Launch Runbook

## Required hosted configuration

- Create a Vercel project from `/Users/jheller/Desktop/tuto/tuto/web`
- Set preview and production env vars:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `DATABASE_URL` or `POSTGRES_URL`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRO_PRICE_ID`
  - `STRIPE_TEAM_PRICE_ID`
- In Clerk, bind the deployed domain and set sign-in/sign-up redirects to `/dashboard`
- In Stripe, point the webhook endpoint to `/api/webhooks/stripe`
- Apply `web/migrations/*.sql` to the hosted Postgres database

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
