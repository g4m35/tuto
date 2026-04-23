# Verification Report

## Current Status Note

This file records the earlier architecture/auth/billing verification phases.

Since then, the repo has also landed KB-backed course generation changes in both `web/` and `deeptutor/`, plus the billing-management and launch-coverage work listed below. For the current operator-facing launch gates, use [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) and [`ROADMAP.md`](ROADMAP.md) as the up-to-date references.

## Summary

Verification now passes after removing the explicit Stripe `apiVersion` override from `web/lib/billing.ts` and rerunning the frontend build.

## Latest Shipped Work

- Pushed to `origin/main`:
  - `46bdfc0` `feat(web): add billing management and launch coverage`
  - `4e224f1` `chore(ci): harden web launch checks`
- Landed:
  - self-serve billing portal route and pricing-page paid-user management flow
  - shared server-side billing helpers to keep checkout/portal logic testable
  - focused web launch tests for billing helpers, Stripe webhook tier transitions, and cross-user course ownership
  - CI wired to run `web` typecheck plus the focused node tests
  - upstream-sync verification updated to report web node tests, typecheck, and build separately
- Verification run before push:
  - `npm run test:node` in `web`: `12/12` passed
  - `npm run typecheck` in `web`: passed
  - `npm run build` in `web`: passed
  - workflow YAML parse check: `YAML_OK`
  - local `GET http://localhost:3000/pricing`: `200 OK`
- State at that point:
  - `main` clean and matching `origin/main`
  - app serving locally from the clean checkout
- Biggest remaining production gaps:
  - real deploy/rollback path
  - staging Stripe/Clerk validation
  - finalized cancel/downgrade policy
  - one signed-in end-to-end browser smoke test

## Checklist

- [x] `npm install` completes without errors
  - Verified in `web/`
  - Result: completed successfully
  - Notes: npm reported funding info and vulnerability warnings, but no install error

- [x] `npm run build` completes
  - Verified in `web/`
  - Result: completed successfully
  - Fix applied:
    - Removed the explicit `apiVersion` from the Stripe server client constructor in `web/lib/billing.ts`
    - This allows `stripe@22.0.1` to use its SDK default API version and avoids the literal type mismatch

- [x] `proxy.ts` exports correct config
  - Verified file: `web/proxy.ts`
  - Includes:
    - `clerkMiddleware(...)` default export
    - public route matcher for `/`, `/sign-in`, `/sign-up`, `/pricing`, and `/api/webhooks`
    - `config.matcher` export covering app routes and API routes

- [x] All new files use TypeScript
  - Verified new files created in this task:
    - `ARCHITECTURE.md`
    - `VERIFICATION.md`
    - `web/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
    - `web/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
    - `web/components/auth/SidebarUserMenu.tsx`
    - `web/proxy.ts`
    - `web/lib/billing.ts`
    - `web/lib/limits.ts`
    - `web/app/api/webhooks/stripe/route.ts`
  - All new code files are `.ts` or `.tsx`

- [x] No modifications to core DeepTutor `/src` files
  - This fork does not use a top-level `/src` directory for backend code
  - Verified no task changes were made under `deeptutor/`
  - Task changes were limited to `web/`, root docs, and root `.env.example`

## Phase Notes

- Phase 1 completed and committed as `docs: add architecture map`
- Phase 2 completed and committed as `feat: add Clerk authentication`
- Phase 3 completed and committed as `feat: add billing foundation`
- Phase 4 verification now passes after the Stripe typing fix
- Post-verification launch hardening completed in:
  - `4e224f1` `chore(ci): harden web launch checks`
  - `46bdfc0` `feat(web): add billing management and launch coverage`
