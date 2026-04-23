# Launch Checklist

This checklist is for the SaaS-facing fork in this repository, not for the upstream open-source DeepTutor demo alone.

Date reviewed: 2026-04-22

## Current Status

### Implemented and verified

- [x] Clerk route protection is wired in [`web/proxy.ts`](web/proxy.ts).
- [x] Stripe server helpers and webhook-based tier syncing are present in [`web/lib/billing.ts`](web/lib/billing.ts) and [`web/app/api/webhooks/stripe/route.ts`](web/app/api/webhooks/stripe/route.ts).
- [x] A pricing surface now exists in [`web/app/pricing/page.tsx`](web/app/pricing/page.tsx), and the top-nav upgrade CTA routes there from [`web/components/ui/TopNav.tsx`](web/components/ui/TopNav.tsx).
- [x] Stripe Checkout Session creation is wired in [`web/app/api/billing/checkout/route.ts`](web/app/api/billing/checkout/route.ts).
- [x] Usage-limit enforcement exists in [`web/lib/usage.ts`](web/lib/usage.ts), [`web/lib/limits.ts`](web/lib/limits.ts), and [`web/lib/withUsageLimit.ts`](web/lib/withUsageLimit.ts).
- [x] Per-user course persistence is wired in [`web/lib/course-store.ts`](web/lib/course-store.ts) with SQL schema in [`web/migrations/003_courses.sql`](web/migrations/003_courses.sql).
- [x] KB-backed upload flow now creates a knowledge base, waits for readiness, persists `kb_name`, and starts guided learning against that KB via [`web/lib/deeptutor.ts`](web/lib/deeptutor.ts), [`web/app/api/courses/route.ts`](web/app/api/courses/route.ts), [`deeptutor/api/routers/guide.py`](deeptutor/api/routers/guide.py), and [`deeptutor/agents/guide/guide_manager.py`](deeptutor/agents/guide/guide_manager.py).

### Stop-ship gaps

- [ ] There is still no billing-portal or self-serve subscription-management flow for existing subscribers.
- [ ] The pricing and checkout flow now exists, but it still needs final plan validation, copy polish, and paid-user management UX.
- [ ] The Docker deployment files are geared toward the upstream all-in-one OSS app and do not yet wire the fork's Clerk, Stripe, or Postgres requirements.
- [ ] The release workflow still targets `ghcr.io/hkuds/deeptutor` in [`.github/workflows/docker-release.yml`](.github/workflows/docker-release.yml), not this fork's own registry/image.
- [ ] CI currently covers backend import/smoke checks only; it does not gate the `web/` build, auth flow, billing flow, or purchase path.
- [ ] There is no built-in monitoring/alerting stack beyond logs and basic health endpoints.

## 1. Auth And Identity

### Required before launch

- [ ] Use production Clerk keys in the deployment environment, not local test keys from [`web/.env.example`](web/.env.example).
- [ ] In Clerk, configure the production app domains, redirect URLs, and allowed origins for:
  - sign-in
  - sign-up
  - dashboard redirect
  - any preview/staging domain you rely on
- [ ] Keep keyless mode disabled in production with `NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true`.
- [ ] Verify that all app routes requiring identity remain protected by [`web/proxy.ts`](web/proxy.ts).
- [ ] Verify that no course API route returns another user's data. Focus on:
  - [`web/app/api/courses/route.ts`](web/app/api/courses/route.ts)
  - [`web/app/api/courses/[id]/exercises/route.ts`](web/app/api/courses/[id]/exercises/route.ts)
  - [`web/lib/course-store.ts`](web/lib/course-store.ts)

### Operator verification

- [ ] Signed-out user cannot open `/dashboard`, `/create`, or `/api/courses`.
- [ ] Signed-in user can create and reopen only their own courses.
- [ ] A second user cannot infer another user's billing tier, usage state, course IDs, or knowledge-base names.

## 2. Billing And Paid Plans

### What exists today

- Stripe webhook parsing and user-tier updates exist in [`web/app/api/webhooks/stripe/route.ts`](web/app/api/webhooks/stripe/route.ts).
- Tier limits exist in [`web/lib/limits.ts`](web/lib/limits.ts).
- Usage recording and enforcement exist in [`web/lib/usage.ts`](web/lib/usage.ts) and [`web/lib/withUsageLimit.ts`](web/lib/withUsageLimit.ts).

### Missing before charging customers

- [ ] Add a billing-portal or cancellation-management flow for existing subscribers.
- [ ] Decide and implement downgrade behavior after cancellation or failed payment.
- [ ] Decide whether team billing is actually launch-ready; the code has a `team` tier, but no visible team-management UX.
- [ ] Validate that the current plan prices and Stripe product IDs match what you actually intend to sell.

### Required environment variables

- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRO_PRICE_ID`
- [ ] `STRIPE_TEAM_PRICE_ID`

### Operator verification

- [ ] A free user can hit a limit and gets a deterministic upgrade response.
- [ ] The `/pricing` page can start a Stripe checkout redirect for both `pro` and `team`.
- [ ] A successful Stripe checkout upgrades the user's `tier` within minutes through the webhook path.
- [ ] `invoice.payment_failed` moves the user into the intended degraded state.
- [ ] Subscription cancellation returns the user to the intended plan at the intended time.
- [ ] Replay the key webhook events against staging before launch:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

## 3. Database And Persistence

### Current repo shape

- The web app uses Postgres when `DATABASE_URL` or `POSTGRES_URL` is set via [`web/lib/db.ts`](web/lib/db.ts).
- If no database is configured, course data falls back to the local file store in [`web/lib/course-store.ts`](web/lib/course-store.ts). That fallback is useful for local dev, not for production.
- SQL schema files exist in:
  - [`web/migrations/001_users.sql`](web/migrations/001_users.sql)
  - [`web/migrations/002_usage.sql`](web/migrations/002_usage.sql)
  - [`web/migrations/003_courses.sql`](web/migrations/003_courses.sql)

### Launch requirements

- [ ] Provision a production Postgres database.
- [ ] Apply the web migrations in order before first traffic.
- [ ] Write down the exact migration command and owner for deploy day.
- [ ] Confirm backups and retention for the production database.
- [ ] Confirm restores against a staging copy before launch.

### Operator commands

Run these manually until the repo has a migration runner:

```bash
psql "$DATABASE_URL" -f web/migrations/001_users.sql
psql "$DATABASE_URL" -f web/migrations/002_usage.sql
psql "$DATABASE_URL" -f web/migrations/003_courses.sql
```

## 4. KB-Backed Course Generation

### Expected production behavior

- Topic-mode course creation should work without a knowledge base.
- Upload-mode course creation should:
  - create a knowledge base
  - wait for knowledge-base readiness
  - create a guided-learning session with `kb_name`
  - start the guided session using the persisted `kb_name`

### Required backend conditions

- [ ] `DEEPTUTOR_URL` points the web app at the live Python backend.
- [ ] The backend has valid LLM and embedding configuration.
- [ ] The backend can write persistent data under its runtime data directories.
- [ ] The backend is not running in stub mode for production course generation.

### Operator verification

- [ ] `GET /api/health/deeptutor` on the web app reports `connected: true`.
- [ ] `GET /api/v1/system/status` on the backend reports configured LLM and embeddings.
- [ ] Topic-mode course creation succeeds for a signed-in user.
- [ ] Upload-mode course creation succeeds for a signed-in user and stores `knowledge_base_name` on the course row.
- [ ] Guided-session payloads returned by the backend include the expected `kb_name`.
- [ ] Exercise generation still works for a course created from an uploaded source.

## 5. Deployment And Release

### Important repo caveats

- The all-in-one Docker setup in [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml), and [`docker-compose.ghcr.yml`](docker-compose.ghcr.yml) is written for the upstream app and its Python-first environment.
- Those files do not currently document or pass through the fork's Clerk, Stripe, or Postgres web settings.
- The GHCR workflow in [`.github/workflows/docker-release.yml`](.github/workflows/docker-release.yml) still pushes `ghcr.io/hkuds/deeptutor`. Do not rely on that image for this fork's SaaS launch.

### Launch requirements

- [ ] Choose the real production deployment target for this fork.
- [ ] Publish your own image or deployment artifact for this fork.
- [ ] Inject production values for:
  - Clerk
  - Stripe
  - `DATABASE_URL`
  - `DEEPTUTOR_URL`
  - any proxy auth (`DEEPTUTOR_API_KEY`) if used
- [ ] Make persistent volumes or storage explicit for:
  - backend user data
  - backend knowledge bases
  - logs
  - database
- [ ] Add a documented rollback path that restores the previous app version and leaves data intact.

### Operator verification

- [ ] Fresh deploy boots without manual shell patching.
- [ ] Health checks succeed after deploy.
- [ ] Web can reach backend from the production domain.
- [ ] Clerk redirects use the production domain, not localhost.
- [ ] Stripe webhook endpoint is reachable from Stripe in production.
- [ ] Rollback to the prior release can be completed in under 15 minutes.

## 6. Monitoring, Logging, And Incident Response

### What exists today

- Container and app logs are available through Docker and backend log files.
- The web app exposes [`web/app/api/health/deeptutor/route.ts`](web/app/api/health/deeptutor/route.ts).
- Docker health checks hit the backend root endpoint in the compose files.

### Missing before launch

- [ ] Uptime monitoring for web and backend.
- [ ] Alerting for webhook failures, backend health failures, and repeated KB-processing failures.
- [ ] A single place to inspect production logs.
- [ ] An incident note covering who checks what first during an outage.

### Minimum incident runbook

- [ ] Check web health endpoint.
- [ ] Check backend system status endpoint.
- [ ] Check recent Stripe webhook deliveries.
- [ ] Check recent deploys and environment-variable changes.
- [ ] Check backend logs for LLM, embedding, or KB-ingestion errors.
- [ ] Check Postgres connectivity and recent write failures.

## 7. CI And Launch Tests

### Current CI coverage

- [x] Backend import checks run in [`.github/workflows/tests.yml`](.github/workflows/tests.yml).
- [x] Backend smoke tests run in [`.github/workflows/tests.yml`](.github/workflows/tests.yml).
- [ ] No equivalent required GitHub Action currently verifies the `web/` production build for this fork.
- [ ] No end-to-end purchase/auth/course-generation flow is currently enforced in CI.

### Must-test before launch

- [ ] Sign up
- [ ] Sign in
- [ ] Create topic-based course
- [ ] Create upload-based course
- [ ] Wait for KB readiness
- [ ] Resume existing course
- [ ] Generate exercises
- [ ] Hit document limit as free user
- [ ] Upgrade through Stripe
- [ ] Confirm webhook updates tier
- [ ] Retry the previously blocked action after upgrade
- [ ] Cancel subscription and verify downgraded behavior

## 8. Recommended Order Of Operations

1. Finish the self-serve billing surface: portal/cancel flow plus final plan validation.
2. Lock production deployment for this fork, not the upstream GHCR image.
3. Provision Postgres and document migration execution.
4. Add monitoring and alerting for web, backend, and Stripe webhooks.
5. Run the full manual staging checklist above.
6. Add CI coverage for web build and at least one happy-path end-to-end flow.
7. Soft-launch to a very small cohort before opening broader paid access.
