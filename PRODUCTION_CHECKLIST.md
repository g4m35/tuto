# Production Checklist

This is the shortest practical path from the current local build to a paid, supportable production launch.

## Completed Recently

- Clerk auth is wired into the web app.
- Stripe billing foundations and webhook handling are present.
- A self-serve pricing page, Stripe Checkout Session route, and billing-portal route are now in place.
- Course creation now creates real knowledge bases and grounds guided sessions with `kb_name`.
- Backend dev startup was hardened so `python -m deeptutor.api.run_server` works reliably from clean worktrees.
- CI now runs web launch typecheck plus targeted billing and ownership node tests alongside the backend smoke suite.

## Launch Slice

Ship one narrow paid surface first:

- sign in
- create a topic course
- create an upload-backed course
- generate guided learning content
- enforce free-tier usage limits
- upgrade with Stripe
- manage an existing paid subscription
- unlock usage after webhook processing

Everything below is in service of that slice.

## Release Gates

### 1. Hosting and Persistence

Pass when all are true:

- `web` is deployed as a real Next.js service, not only `npm run dev`
- `deeptutor` is deployed as a real Python service, not only `uvicorn --reload`
- user/course/billing data survives restarts
- knowledge bases survive restarts
- secrets live in host environment config, not checked-in files

Minimum required environment:

- Clerk publishable and secret keys
- Stripe secret key and webhook secret
- `DEEPTUTOR_URL`
- LLM provider credentials
- embedding provider credentials
- database/storage configuration if production differs from local defaults

Gemini-only shortcut:

- Set `LLM_BINDING=gemini`
- Set `LLM_MODEL` to your chosen Gemini chat model
- Set `LLM_HOST=https://generativelanguage.googleapis.com/v1beta/openai/`
- Set `EMBEDDING_BINDING=gemini`
- Set `EMBEDDING_MODEL=gemini-embedding-001`
- Set `EMBEDDING_HOST=https://generativelanguage.googleapis.com/v1beta/openai/`
- Reuse the same Google AI Studio key for `LLM_API_KEY`, `EMBEDDING_API_KEY`, `GEMINI_API_KEY`, and `GOOGLE_API_KEY`

### 2. Auth and Data Ownership

Pass when all are true:

- signed-out users cannot access app routes or protected APIs
- one user cannot read another user's courses, usage, or billing state
- Stripe customer and subscription records map cleanly back to the authenticated user

Focus files:

- `web/proxy.ts`
- `web/app/api/courses/route.ts`
- `web/app/api/courses/[id]/exercises/route.ts`
- `web/lib/course-store.ts`
- `web/lib/usage.ts`

### 3. Billing and Limits

Pass when all are true:

- checkout/session creation works in production mode
- existing paid users can open the billing portal and return to the app
- successful Stripe webhooks update tier state within minutes
- failed or missing webhook processing is visible in logs
- free users cannot exceed paid-only limits
- canceled subscriptions downgrade correctly

Focus files:

- `web/lib/billing.ts`
- `web/app/api/webhooks/stripe/route.ts`
- `web/lib/limits.ts`
- `web/lib/withUsageLimit.ts`

### 4. Course Creation and KB Readiness

Pass when all are true:

- topic courses still create successfully without a KB
- upload courses wait for KB readiness before guided learning starts
- `guide/create_session` persists `kb_name`
- `guide/start` and session reads return the stored `kb_name`
- upload-backed courses continue working after a deploy or restart

Focus files:

- `web/lib/deeptutor.ts`
- `web/app/api/courses/route.ts`
- `deeptutor/api/routers/guide.py`
- `deeptutor/agents/guide/guide_manager.py`

### 5. Observability and Recovery

Pass when all are true:

- there is a fast way to answer "is web up?"
- there is a fast way to answer "is backend up?"
- failed KB ingestion, Stripe webhook, and guided session startup errors are visible in logs
- deploy rollback steps are written down and tested once

Recommended checks:

- frontend health probe
- backend root or router health probe
- error log capture for webhook failures
- restart and rollback commands documented for the chosen host

## Manual Smoke Test

Run this before charging anyone:

1. Sign up a fresh user.
2. Create a topic-only course.
3. Create an upload-backed course with a small document.
4. Confirm KB reaches ready state.
5. Confirm guided learning starts and the session carries a `kb_name`.
6. Generate exercises.
7. Hit the free limit.
8. Upgrade through Stripe checkout.
9. Confirm webhook updates the user tier.
10. Open the billing portal and confirm the Stripe customer can manage the subscription.
11. Retry the blocked action and confirm it is now allowed.
12. Cancel or downgrade and confirm limits change back appropriately.

## Recommended Order

1. Deploy web and backend to a stable host with persistent storage.
2. Configure production Clerk and Stripe settings.
3. Run the manual smoke test above end-to-end.
4. Add one automated happy-path test for sign in, course creation, upgrade, and billing management.
5. Soft-launch to a tiny cohort before broader rollout.

## Useful Commands

Local backend start:

```bash
./.venv/bin/python -m deeptutor.api.run_server
```

Local web start:

```bash
cd web
npm run dev
```

Backend health:

```bash
curl -f http://localhost:8001/
```

Guide health:

```bash
curl -f http://localhost:8001/api/v1/guide/health
```

## Current Biggest Gaps

These are the items most likely to block a real paid launch:

- production deployment and rollback runbook
- end-to-end billing verification in a production-like environment
- finalized cancellation and downgrade behavior for paid plans
- auth and ownership audit across all user-data routes
- one automated launch-path smoke test
