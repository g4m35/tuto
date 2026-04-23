# Deployed Verification Note

Date checked: 2026-04-22

## Scope

This note answers one question: can the current repo/workspace verify real hosted behavior for:

- Clerk auth and middleware enforcement
- Stripe checkout and billing portal flows
- Stripe webhook-driven database writes

Short answer: not from the current workspace alone.

## What I checked

### 1. GitHub deployment metadata

Commands run:

```bash
gh repo view g4m35/tuto --json nameWithOwner,url,defaultBranchRef
gh api repos/g4m35/tuto/environments
gh api "repos/g4m35/tuto/deployments?per_page=10"
```

Evidence:

- Repository resolves correctly as `g4m35/tuto`
- GitHub environments response: `{"total_count":0,"environments":[]}`
- GitHub deployments response: `[]`

Conclusion:

- There is no deployment target or recorded deployment visible from GitHub in this workspace.
- There is no hosted URL in GitHub metadata that I can hit to verify live Clerk middleware or live DB writes.

### 2. Workflow and deployment wiring in-repo

Files checked:

- [/Users/jheller/Desktop/tuto/tuto/.github/workflows/docker-release.yml](/Users/jheller/Desktop/tuto/tuto/.github/workflows/docker-release.yml)
- [/Users/jheller/Desktop/tuto/tuto/.github/workflows/tests.yml](/Users/jheller/Desktop/tuto/tuto/.github/workflows/tests.yml)

Evidence:

- `docker-release.yml` publishes a Docker image to GHCR on GitHub Release.
- There is no deploy-to-staging or deploy-to-production workflow in the repo.
- `tests.yml` runs import checks, smoke tests, web launch smoke tests, and a build.
- `tests.yml` uses dummy launch env values for Clerk during build, not real hosted credentials.

Conclusion:

- CI proves build/test coverage, not a deployed environment.
- Nothing in the repo currently creates a review URL, staging URL, or production URL automatically.

### 3. Local environment availability

Files checked for key presence only, without exposing values:

- [/Users/jheller/Desktop/tuto/tuto/.env](/Users/jheller/Desktop/tuto/tuto/.env)
- [/Users/jheller/Desktop/tuto/tuto/web/.env.local](/Users/jheller/Desktop/tuto/tuto/web/.env.local)
- [/Users/jheller/Desktop/tuto/tuto/web/.env.example](/Users/jheller/Desktop/tuto/tuto/web/.env.example)

Evidence:

- Root `.env` contains Clerk-related keys and API config, but no `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, or `STRIPE_TEAM_PRICE_ID`.
- `web/.env.local` contains Clerk keys and frontend API base settings, but no database or Stripe keys.
- `web/.env.example` documents the full required hosted set, including:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRO_PRICE_ID`
  - `STRIPE_TEAM_PRICE_ID`

Conclusion:

- This workspace does not currently expose the web app with real DB-backed billing env or real Stripe env.
- That blocks real checkout, real portal, real webhook replay, and real DB-write verification from local config alone.

### 4. Hosted-base-url expectations in test tooling

Files checked:

- [/Users/jheller/Desktop/tuto/tuto/web/playwright.config.ts](/Users/jheller/Desktop/tuto/tuto/web/playwright.config.ts)
- [/Users/jheller/Desktop/tuto/tuto/LAUNCH_RUNBOOK.md](/Users/jheller/Desktop/tuto/tuto/LAUNCH_RUNBOOK.md)

Evidence:

- Playwright expects `WEB_BASE_URL` or `NEXT_PUBLIC_API_BASE`, otherwise defaults to `http://localhost:3000`.
- `LAUNCH_RUNBOOK.md` explicitly says staging verification still needs manual confirmation for:
  - signed-out `/pricing`
  - signed-in `/pricing`
  - checkout return
  - webhook tier update
  - billing portal

Conclusion:

- The repo already assumes hosted verification is a separate step.
- No hosted URL is present in the current workspace to run those checks against.

### 5. Code-path readiness for the hosted checks

Files checked:

- [/Users/jheller/Desktop/tuto/tuto/web/proxy.ts](/Users/jheller/Desktop/tuto/tuto/web/proxy.ts)
- [/Users/jheller/Desktop/tuto/tuto/web/app/api/webhooks/stripe/route.ts](/Users/jheller/Desktop/tuto/tuto/web/app/api/webhooks/stripe/route.ts)
- [/Users/jheller/Desktop/tuto/tuto/web/lib/db.ts](/Users/jheller/Desktop/tuto/tuto/web/lib/db.ts)
- [/Users/jheller/Desktop/tuto/tuto/web/app/pricing/page.tsx](/Users/jheller/Desktop/tuto/tuto/web/app/pricing/page.tsx)

Evidence:

- Middleware protects all non-public routes and leaves `/pricing` public.
- The Stripe webhook route is `runtime = "nodejs"` and writes to `users` via `query(...)`.
- DB access requires `DATABASE_URL` or `POSTGRES_URL`.
- Pricing UI still contains explicit launch placeholders such as:
  - "Decide the actual price points and update the plan copy to match Stripe."
  - "Wire support email, refund policy, and customer-facing billing help text."

Conclusion:

- The app code is prepared for hosted verification.
- The missing piece is not the route surface; it is the hosted environment, secrets, webhook target, and a reachable deployment URL.

## What is still missing for real verification

These are the minimum missing inputs:

- A real hosted web URL for this fork or a staging deployment
- Real hosted Clerk configuration bound to that domain
- Real hosted web env with:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRO_PRICE_ID`
  - `STRIPE_TEAM_PRICE_ID`
- Applied Postgres migrations for the hosted database
- A Stripe test-mode webhook endpoint pointing at `https://<host>/api/webhooks/stripe`
- One test Clerk user and one Stripe test card path
- A support contact, refund policy, and terms/privacy URLs or final copy to replace current placeholders

## What can be verified right now

From the current repo/workspace, these are the strongest concrete claims:

- The repo builds successfully with the current launch slice.
- Local contract tests cover pricing readiness, billing helpers, and Stripe webhook contract behavior.
- Middleware config and webhook DB-write code paths exist in source.
- The repo does not currently expose any actual hosted deployment metadata to verify live behavior against.

## Minimal steps to complete real hosted verification

### A. Verify real Clerk auth and middleware in a hosted environment

1. Deploy the current branch to a staging URL.
2. In Clerk, add that exact staging domain and confirm redirect URLs for `/sign-in` and `/sign-up`.
3. Set the real Clerk env vars in the hosted web app.
4. Verify:
   - signed-out user can open `/pricing`
   - signed-out user is redirected on a protected route such as `/create`
   - sign-in returns to the expected route
   - signed-in user can open protected routes without middleware loops

Success evidence to capture:

- staging URL used
- one signed-out redirect screenshot
- one signed-in protected-route screenshot
- one successful sign-in redirect result

### B. Verify real DB writes from checkout and Stripe webhook

1. Set hosted DB env and run `web/migrations/*.sql`.
2. Set hosted Stripe env and create active test-mode prices matching `STRIPE_PRO_PRICE_ID` and `STRIPE_TEAM_PRICE_ID`.
3. Point Stripe test webhook delivery to `https://<host>/api/webhooks/stripe`.
4. Sign in as a free user and start checkout from `/pricing`.
5. Complete checkout with a Stripe test card.
6. Confirm:
   - browser returns to `/pricing?checkout=success`
   - Stripe shows successful webhook delivery
   - hosted database `users` row now has updated `tier`, `subscription_status`, `current_period_end`, and `stripe_customer_id`
7. Open billing portal and confirm the existing customer can reach it.

Success evidence to capture:

- Stripe event id for `checkout.session.completed`
- Stripe event id for `customer.subscription.updated`
- DB row before checkout
- DB row after webhook processing
- pricing page showing upgraded tier

## Minimal SQL check for hosted DB verification

Run this against the hosted Postgres after the webhook completes:

```sql
select
  clerk_id,
  tier,
  subscription_status,
  stripe_customer_id,
  current_period_end,
  updated_at
from users
where clerk_id = '<staging-clerk-user-id>';
```

Expected result:

- `tier` changes from `free` to `pro` or `team`
- `subscription_status` reflects the Stripe subscription state
- `stripe_customer_id` is populated
- `current_period_end` is populated for active recurring plans

## Final status

Hosted verification is not currently possible from this repo/workspace alone because the required hosted deployment target and billing/database credentials are not present here.

The code appears ready for that hosted pass, but the real launch gate is now operational setup, not additional local-only proof.
