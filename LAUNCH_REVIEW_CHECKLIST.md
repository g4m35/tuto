# Launch Review Checklist

This document turns the launch review plan into a concrete checklist for this fork.

Goal: launch a paid version of the `courses` experience without getting buried in auth, billing, data, or operations failures.

Launch slice for this checklist:

- Sell and support the `courses` surface only
- Require authenticated use
- Enforce usage limits by tier
- Treat all other DeepTutor capabilities as out of scope unless they directly affect `courses`

Commands below assume the repository root: `/Users/jheller/Desktop/tuto/tuto`

## Working Rules

- After each test run, record the result in the review notes before moving on.
- For each review item, verify three things:
  - Works: the happy path and the obvious failure path both behave correctly
  - Efficient: latency, retries, duplicate work, and build/runtime cost are acceptable
  - Secure: auth, tenant boundaries, secrets, and webhook validation are correct
- Do not treat "code exists" as a pass. Every item needs evidence.

## Suggested Owners

- Product: scope, onboarding, pricing copy, support burden
- App: Next.js routes, auth UX, billing UX, course flows
- Backend: Python API, provider/runtime behavior, websocket/runtime stability
- Platform: deployment, secrets, migrations, rollback, observability
- Business: pricing, terms, privacy, refunds, analytics, customer support

## Launch Blockers Found During Repo Scan

- [x] Customer-facing `pricing` route now exists under `web/app/pricing`, and usage-limit responses can land somewhere real.
  - Primary files:
    - `web/app/api/courses/route.ts`
    - `web/app/pricing/page.tsx`
    - `web/lib/withUsageLimit.ts`
  - Evidence command:
    ```bash
    rg --files web/app | rg 'pricing'
    ```
  - Pass if:
    - a real pricing page exists
    - upgrade links resolve
    - the page explains plans, current tier state, and the next action

- [x] Checkout and billing-portal routes now exist alongside the webhook flow.
  - Primary files:
    - `web/lib/billing.ts`
    - `web/app/api/billing/checkout/route.ts`
    - `web/app/api/billing/portal/route.ts`
    - `web/app/api/webhooks/stripe/route.ts`
  - Evidence command:
    ```bash
    rg -n "checkout\\.sessions|billing portal|portal session|createCheckout|createPortal" web/app web/lib -S
    ```
  - Pass if:
    - a user can start checkout from the app
    - a paid user can manage their subscription
    - the flow is testable in staging without manual database edits

## Phase 0: Freeze the Paid Launch Slice

- [ ] Write a one-paragraph product definition for the paid offer.
  - Owner: Product
  - Scope:
    - what a customer is buying
    - who it is for
    - what is intentionally not included at launch
  - Primary files:
    - `README.md`
    - `web/app/(app)/dashboard/page.tsx`
    - `web/app/api/courses/route.ts`
  - Pass if:
    - everyone on the team can explain the product in one sentence
    - the UI and pricing copy match that sentence

- [ ] Confirm `courses` is the only paid surface at launch.
  - Owner: Product
  - Evidence command:
    ```bash
    rg -n "Upgrade|Pro|Team|billing|subscription|limit_reached" web -S
    ```
  - Pass if:
    - upgrade prompts map only to the paid launch slice
    - no other feature implies paid support unless it is really launch-ready

## Phase 1: Money Path Review

- [ ] Confirm the purchase entrypoint exists and is linked from the app.
  - Owner: App
  - Primary files:
    - `web/components/ui/TopNav.tsx`
    - `web/app/(app)/dashboard/page.tsx`
    - `web/app/pricing/page.tsx`
    - `web/lib/billing.ts`
  - Review:
    - verify there is a visible upgrade action
    - verify it leads to a real purchase flow, not placeholder copy
  - Pass if:
    - a new user can discover how to upgrade in under 30 seconds
    - the CTA works on desktop and mobile

- [ ] Confirm checkout session creation and success return flow.
  - Owner: App
  - Primary files:
    - `web/lib/billing.ts`
    - any checkout route you add or confirm exists
  - Evidence commands:
    ```bash
    rg -n "checkout\\.sessions|Checkout.Session|success_url|cancel_url" web -S
    npm run build --prefix web
    ```
  - Security check:
    - no secret key used client-side
    - success URLs cannot be tampered with to expose another account
  - Efficiency check:
    - duplicate checkout attempts do not create messy state
  - Pass if:
    - a logged-in free user can start checkout successfully
    - canceled checkout returns to a safe page
    - successful checkout transitions the user toward paid access
    - `/pricing` reflects the attempted plan and explains that webhook confirmation may lag checkout success

- [ ] Verify Stripe webhook processing.
  - Owner: App + Platform
  - Primary files:
    - `web/app/api/webhooks/stripe/route.ts`
    - `web/lib/billing.ts`
  - Evidence commands:
    ```bash
    npm run build --prefix web
    rg -n "constructEvent|checkout.session.completed|customer.subscription.updated|customer.subscription.deleted|invoice.payment_failed" web/app/api/webhooks/stripe/route.ts -n
    ```
  - Optional local test if Stripe CLI is available:
    ```bash
    stripe listen --forward-to localhost:3782/api/webhooks/stripe
    ```
  - Security check:
    - webhook signature verification is enabled
    - missing or invalid signatures are rejected
  - Efficiency check:
    - duplicate events are idempotent enough not to corrupt user tier state
  - Pass if:
    - webhook updates tier and subscription state correctly
    - payment failure and cancellation paths are reflected in stored user state

- [ ] Verify tier persistence and limit enforcement.
  - Owner: App
  - Primary files:
    - `web/app/pricing/page.tsx`
    - `web/lib/limits.ts`
    - `web/lib/usage.ts`
    - `web/lib/withUsageLimit.ts`
    - `web/migrations/001_users.sql`
    - `web/migrations/002_usage.sql`
  - Evidence commands:
    ```bash
    rg -n "free|pro|team|limit_reached|recordUsage|checkLimit" web/lib web/app/api -S
    npm run build --prefix web
    ```
  - Security check:
    - free users cannot bypass limits via direct API calls
  - Efficiency check:
    - usage recording does not create duplicate or unbounded writes under retries
  - Pass if:
    - free users hit limits consistently
    - paid users receive the correct allowances
    - downgrade and payment-failed states reduce entitlements safely
    - a signed-in user can see enough current quota state on `/pricing` to understand why they should upgrade or manage billing

## Phase 2: Auth, Data Ownership, and Tenant Boundaries

- [ ] Verify protected routes are actually protected.
  - Owner: App
  - Primary files:
    - `web/proxy.ts`
    - `web/app/layout.tsx`
    - `web/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
    - `web/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
  - Evidence commands:
    ```bash
    sed -n '1,220p' web/proxy.ts
    npm run build --prefix web
    ```
  - Manual tests:
    - anonymous user visits dashboard
    - anonymous user visits course page
    - logged-in user returns to protected pages
  - Pass if:
    - anonymous access is redirected or rejected everywhere it should be
    - auth routes and app routes do not loop or break

- [ ] Verify course read/write isolation by `clerk_id`.
  - Owner: App
  - Primary files:
    - `web/app/api/courses/route.ts`
    - `web/app/api/courses/[id]/exercises/route.ts`
    - `web/lib/course-store.ts`
  - Evidence commands:
    ```bash
    sed -n '1,220p' web/app/api/courses/route.ts
    sed -n '1,240p' 'web/app/api/courses/[id]/exercises/route.ts'
    sed -n '1,260p' web/lib/course-store.ts
    ```
  - Security check:
    - one user cannot fetch another user's course by guessing an id
    - all queries include `clerk_id` ownership filters
  - Efficiency check:
    - hot list/detail queries are indexed or bounded enough for launch traffic
  - Pass if:
    - cross-user course access is impossible through supported routes
    - ownership filters are present on every course read/write path

- [ ] Verify billing and usage state cannot leak across users.
  - Owner: App
  - Primary files:
    - `web/lib/usage.ts`
    - `web/lib/withUsageLimit.ts`
    - `web/app/api/webhooks/stripe/route.ts`
  - Evidence command:
    ```bash
    rg -n "clerk_id|stripe_customer_id|tier|subscription_status" web -S
    ```
  - Pass if:
    - user tier lookup is always bound to the authenticated user or matched Stripe customer
    - support staff do not need SQL surgery for normal billing events

## Phase 3: Backend Production Readiness

- [ ] Verify env/config failure behavior.
  - Owner: Backend
  - Primary files:
    - `deeptutor/api/main.py`
    - `deeptutor/services/config/loader.py`
    - `deeptutor/services/config/env_store.py`
    - `scripts/start_web.py`
    - `scripts/start_tour.py`
  - Evidence commands:
    ```bash
    .venv/bin/pytest -q tests/api tests/services tests/runtime
    python scripts/check_install.py
    ```
  - Security check:
    - secrets are never logged in plaintext during startup failures
  - Efficiency check:
    - startup does not perform avoidable network probes in the hot path unless clearly surfaced
  - Pass if:
    - missing API keys, DB URLs, or backend hosts fail with clear errors
    - startup guidance is actionable for operators

- [ ] Verify provider/runtime failure handling.
  - Owner: Backend
  - Primary areas:
    - `deeptutor/services/llm`
    - `deeptutor/services/embedding`
    - `deeptutor/services/search`
    - `deeptutor/services/session`
  - Evidence commands:
    ```bash
    .venv/bin/pytest -q tests/services/llm tests/services/embedding tests/services/session tests/tools
    ```
  - Security check:
    - provider auth headers are correct and not accidentally mixed across vendors
  - Efficiency check:
    - retries are bounded
    - websocket/session work does not multiply under reconnects
  - Pass if:
    - auth failures, rate limits, and provider outages are mapped clearly
    - user-facing flows degrade predictably instead of hanging

- [ ] Verify backend/web health checks for production smoke.
  - Owner: Backend + Platform
  - Primary files:
    - `web/app/api/health/deeptutor/route.ts`
    - `deeptutor/api/run_server.py`
    - `deeptutor/api/main.py`
  - Evidence commands:
    ```bash
    python scripts/start_web.py
    curl -i http://localhost:3782/api/health/deeptutor
    ```
  - Pass if:
    - operators can tell quickly whether the app is up
    - health checks fail meaningfully when the backend is unreachable

## Phase 4: Launch Test Matrix

- [ ] Run the existing backend CI-equivalent smoke set locally.
  - Owner: Backend
  - Evidence command:
    ```bash
    .venv/bin/pytest --collect-only -q tests/api tests/cli tests/services/test_model_catalog.py tests/services/test_path_service.py tests/services/memory tests/services/session tests/tools
    ```
  - Pass if:
    - collection succeeds
    - no obvious revenue-critical test directories are missing

- [ ] Run frontend build and audit baseline.
  - Owner: App
  - Evidence commands:
    ```bash
    npm run build --prefix web
    npm run lint --prefix web
    npm run audit --prefix web
    ```
  - Efficiency check:
    - build completes in a reasonable time on launch hardware
    - audit findings do not show catastrophic UX/accessibility regressions
  - Pass if:
    - build passes
    - lint passes or has explicitly accepted residual debt
    - UI audit results are reviewed

- [ ] Add or confirm launch-critical automated tests.
  - Owner: App + Backend
  - Missing coverage to confirm or add:
    - auth route protection
    - paid tier transition after webhook
    - failed payment downgrade behavior
    - free-tier limit enforcement
    - existing user returning after payment
    - one Playwright happy-path purchase flow
  - Evidence command:
    ```bash
    rg -n "stripe|billing|usage|course|auth|sign-in|sign-up" web/tests tests -S
    ```
  - Pass if:
    - all money-path states are covered by either automated tests or documented manual scripts

- [ ] Execute the manual launch journeys and record evidence.
  - Owner: Product + App
  - Required journeys:
    - sign up
    - sign in
    - create course by topic
    - upload document
    - generate exercises
    - hit usage cap as free user
    - upgrade
    - receive webhook update
    - cancel or fail payment
    - return as existing paid user
  - Pass if:
    - every journey has screenshots, logs, or notes attached to the launch review
    - every failure state has a user-visible next step

## Phase 5: Onboarding and Support Burden

- [ ] Decide whether launch users must bring their own provider keys.
  - Owner: Product + Business
  - Primary files:
    - `README.md`
    - `.env.example`
    - `web/.env.example`
    - `scripts/start_tour.py`
    - `scripts/start_web.py`
  - Evidence commands:
    ```bash
    sed -n '1,260p' README.md
    sed -n '1,220p' web/.env.example
    ```
  - Pass if:
    - the purchase promise matches setup reality
    - the launch target user can complete setup without engineer help

- [ ] Review onboarding copy for support traps.
  - Owner: Product
  - Check:
    - what the user is buying
    - what is configured for them
    - what they must supply themselves
    - what happens when configuration is incomplete
  - Pass if:
    - first-run confusion is low enough that support volume is predictable

- [ ] Define the support path.
  - Owner: Business
  - Must exist before charging:
    - support email or help route
    - billing issue process
    - refund handling process
    - incident escalation owner
  - Pass if:
    - a paying user knows exactly how to get help

## Phase 6: Deployment, Migration, and Rollback

- [ ] Verify production deployment path.
  - Owner: Platform
  - Primary files:
    - `Dockerfile`
    - `docker-compose.yml`
    - `docker-compose.dev.yml`
    - `docker-compose.ghcr.yml`
    - `.github/workflows/docker-release.yml`
  - Evidence commands:
    ```bash
    docker build -t tuto-launch-check .
    sed -n '1,220p' .github/workflows/docker-release.yml
    ```
  - Efficiency check:
    - image size, build duration, and cache behavior are acceptable
  - Pass if:
    - the app can be built reproducibly
    - release tags and image tags are predictable

- [ ] Verify migrations and empty-environment boot.
  - Owner: Platform + App
  - Primary files:
    - `web/migrations/001_users.sql`
    - `web/migrations/002_usage.sql`
    - `web/migrations/003_courses.sql`
    - `web/lib/db.ts`
  - Evidence commands:
    ```bash
    ls web/migrations
    sed -n '1,220p' web/lib/db.ts
    ```
  - Pass if:
    - operators know how to apply schema changes safely
    - a fresh environment can boot without undocumented manual database edits

- [ ] Write and rehearse a rollback plan.
  - Owner: Platform
  - Must cover:
    - bad web deploy
    - bad migration
    - bad Stripe webhook deploy
    - provider outage
  - Pass if:
    - rollback can be executed in under 15 minutes
    - rollback steps are written down, not tribal knowledge

## Phase 7: Business Readiness

- [ ] Finish pricing copy and plan behavior.
  - Owner: Product + Business
  - Check:
    - plan names
    - monthly/yearly details
    - usage included
    - cancellation behavior
  - Pass if:
    - the app can explain the offer without support intervention

- [ ] Prepare legal and finance basics.
  - Owner: Business
  - Must exist before launch:
    - terms of service
    - privacy policy
    - refund policy
    - business entity and tax handling for Stripe account setup
  - Pass if:
    - nothing in the checkout path is legally ambiguous

- [ ] Add launch analytics.
  - Owner: Product + App
  - Minimum events:
    - sign up
    - first course created
    - upgrade click
    - checkout success
    - webhook success
    - payment failed
    - limit reached
    - retained return user
  - Pass if:
    - you can answer where launch users drop off without scraping logs

## Recommended Sequence

### Week 1

- Freeze scope to `courses`
- Resolve the pricing route and checkout/session gaps
- Audit auth boundaries
- Write deployment and rollback runbooks

### Week 2

- Execute the manual launch journeys
- Add missing launch-critical tests
- Simplify onboarding
- Finalize support, pricing, refund, and privacy materials

### Week 3

- Soft launch to a tiny cohort
- Review failures daily
- Widen access only after billing, auth, and support issues are boring

## Signoff

Do not launch paid access until every item below is true:

- [ ] The paid surface is explicitly scoped
- [ ] Pricing and upgrade UX exist
- [ ] Checkout exists and works
- [ ] Stripe webhooks update tier state correctly
- [ ] Free-tier limits cannot be bypassed
- [ ] Cross-user access has been reviewed and blocked
- [ ] Backend failure modes are predictable
- [ ] Deployment and rollback are documented and tested
- [ ] Support/legal/analytics are in place
- [ ] Manual and automated launch checks have evidence attached
