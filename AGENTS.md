# AGENTS.md - Tuto SaaS Wrapper

## Project Overview

This is a commercial SaaS wrapper around the open-source DeepTutor project (github.com/HKUDS/DeepTutor). We are adding authentication, billing, usage limits, and deploying as a hosted service.

**Goal:** Automated MRR business with minimal ongoing maintenance.

**Target users:** Students, researchers, professionals who want AI tutoring without self-hosting.

## Business Model

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 50 messages/month, 1 document, no TutorBots |
| Pro | $12/month | Unlimited messages, 10 documents, 1 TutorBot |
| Team | $29/month | Multi-user, shared knowledge bases, 5 TutorBots |

BYOK (bring your own API key) option available at reduced price.

## Tech Stack

- **Framework:** Next.js (already in DeepTutor)
- **Auth:** Clerk (@clerk/nextjs)
- **Payments:** Stripe (stripe, @stripe/stripe-js)
- **Database:** Extend existing for user/subscription data
- **Deployment:** Railway or Fly.io
- **Monitoring:** Sentry for errors, Betterstack for uptime

## Current Status

- [ ] Fork created
- [ ] Local dev environment working
- [x] Codebase mapped (ARCHITECTURE.md)
- [x] Clerk auth added
- [ ] Stripe billing added
- [ ] Usage tracking added
- [ ] Landing page created
- [ ] Deployed to Railway
- [ ] Custom domain configured
- [ ] Soft launch

## Code Style

- TypeScript strict mode
- Async/await over .then chains
- Early returns for guard clauses
- No em dashes in any copy
- Comments explain "why", not "what"

## Owner

Jake

---

## Interactive REPL

```bash
deeptutor chat
# inside the REPL: /regenerate or /retry re-runs the last user message
```

## Sub-Agent Definitions

### Agent: Auth
**Scope:** Everything in `/web/src/app/(auth)`, `/web/src/middleware.ts`, Clerk integration
**Tasks:**
- Add Clerk provider
- Protect routes
- Build sign-in/sign-up pages
- Sync user to database on signup

### Agent: Billing
**Scope:** `/web/src/app/api/webhooks/stripe`, `/web/src/lib/billing.ts`, `/web/src/app/pricing`
**Tasks:**
- Stripe checkout integration
- Webhook handlers
- Subscription tier logic
- Pricing page UI

### Agent: Usage
**Scope:** `/web/src/lib/usage.ts`, `/web/src/lib/limits.ts`, database schema for tracking
**Tasks:**
- Message count tracking
- Document upload limits
- Tier-based enforcement
- Usage dashboard component

### Agent: UI
**Scope:** `/web/src/components`, `/web/src/app/(marketing)`
**Tasks:**
- Landing page
- Dashboard layout
- Match screenshot designs
- Component library setup

### Agent: Infra
**Scope:** `Dockerfile`, `docker-compose.yml`, `.github/workflows`, Railway config
**Tasks:**
- CI/CD pipeline
- Auto-deploy on push
- Environment management
- Health checks
