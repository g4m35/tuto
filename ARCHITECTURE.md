# Architecture Map

## Overview

DeepTutor is split into a Next.js frontend in `web/` and a Python backend in `deeptutor/`. There is no top-level `src/` directory in this fork. Backend application code lives under `deeptutor/`, CLI code lives under `deeptutor_cli/`, and supporting scripts and tests live at the repository root.

## Project Structure

### Root

- `web/` - Next.js 16 frontend
- `deeptutor/` - Python backend package, runtime services, agents, and API routers
- `deeptutor_cli/` - Typer-based CLI entry points
- `tests/` - Python test suite
- `scripts/` - launchers, migration scripts, and setup helpers
- `requirements/` - optional dependency group pin files
- `assets/` - release notes, figures, logos, and translated README assets
- `.env.example` - root environment template used by backend and frontend launcher scripts

### Frontend: `web/`

- `app/` - App Router entry points and route groups
- `components/` - reusable UI components
- `context/` - React context providers for app shell and unified chat state
- `hooks/` - client hooks
- `lib/` - frontend helpers for API access, persistence, websocket streaming, theming, and feature types
- `i18n/` and `locales/` - i18n bootstrap and translation JSON
- `public/` - static assets
- `tests/` - frontend unit and Playwright audit tests

### Backend: `deeptutor/`

- `api/` - FastAPI app, server bootstrap, routers, and request utilities
- `agents/` - agent implementations for chat, solve, guide, research, question generation, visualization, and co-writer flows
- `app/` - high-level application facade
- `capabilities/` - capability entry points exposed to the runtime
- `config/` - defaults, schema, constants, and settings accessors
- `core/` - stream, tracing, context, and protocol primitives
- `events/` - async event bus
- `knowledge/` - knowledge base management
- `runtime/` - orchestrator, mode handling, registry, and bootstrap
- `services/` - LLM, embedding, RAG, session, prompt, search, notebook, memory, tutorbot, and config services
- `tools/` - built-in tool implementations used by agents and capabilities
- `tutorbot/` - persistent bot framework, channels, cron, templates, and team tooling
- `utils/` - shared utility helpers

## Frontend Framework and Routing

- Framework: Next.js 16 with React 19 and TypeScript strict mode
- Styling: Tailwind CSS with app-level CSS variables in `web/app/globals.css`
- Fonts: `Plus_Jakarta_Sans` and `Lora` are loaded in `web/app/layout.tsx`
- Routing: App Router with route groups

Current route layout:

- `web/app/layout.tsx` - root HTML shell, `ClerkProvider`, theme script, app shell provider, and i18n bridge
- `web/app/(workspace)/layout.tsx` - workspace shell with `WorkspaceSidebar` and unified chat provider
- `web/app/(utility)/layout.tsx` - utility shell with `UtilitySidebar`

Current page groups:

- `(workspace)` - `/`, `/chat/[sessionId]`, `/agents`, `/co-writer`, `/guide`, `/playground`
- `(utility)` - `/knowledge`, `/memory`, `/notebook`, `/settings`

Important note for follow-up SaaS work:

- This frontend uses `web/app` and `web/lib`, not `web/src/app` or `web/src/lib`
- The `@/*` TypeScript alias resolves from the `web/` root

## Backend API Structure

- Server entry point: `deeptutor/api/run_server.py`
- FastAPI app: `deeptutor/api/main.py`
- Versioned HTTP API prefix: mostly `/api/v1/*`
- Static artifact mount: `/api/outputs`
- WebSocket endpoint: included through `deeptutor/api/routers/unified_ws.py` under `/api/v1`

Registered router modules in `deeptutor/api/main.py`:

- `solve`
- `chat`
- `question`
- `knowledge`
- `dashboard`
- `co_writer`
- `notebook`
- `guide`
- `memory`
- `sessions`
- `question_notebook`
- `settings`
- `system`
- `plugins_api`
- `agent_config`
- `vision_solver`
- `tutorbot`
- `unified_ws`

Frontend API access is centralized in `web/lib/api.ts`, which requires `NEXT_PUBLIC_API_BASE` and builds both HTTP and WebSocket URLs from that base.

## Database and Storage Approach

DeepTutor uses a mixed storage model:

- SQLite for chat sessions, messages, turns, and notebook data
- Postgres for SaaS wrapper user billing state in `web/migrations/001_users.sql`
- JSON files for some settings and configuration state
- File-system workspaces for generated artifacts, guide data, memory files, co-writer assets, and knowledge base contents

Key storage details:

- Runtime root: `data/user/`
- Unified SQLite DB: `data/user/chat_history.db`
- Session store implementation: `deeptutor/services/session/sqlite_store.py`
- Path manager: `deeptutor/services/path_service.py`
- Knowledge bases: `data/knowledge_bases/` with `kb_config.json`
- Memory content: `data/memory/`
- Public artifact serving is restricted through `SafeOutputStaticFiles` in `deeptutor/api/main.py`

## Existing Environment Variables from `.env.example`

### Ports

- `BACKEND_PORT`
- `FRONTEND_PORT`

### LLM

- `LLM_BINDING`
- `LLM_MODEL`
- `LLM_API_KEY`
- `LLM_HOST`
- `LLM_API_VERSION`

### Embedding

- `EMBEDDING_BINDING`
- `EMBEDDING_MODEL`
- `EMBEDDING_API_KEY`
- `EMBEDDING_HOST`
- `EMBEDDING_DIMENSION`
- `EMBEDDING_API_VERSION`

### Web Search

- `SEARCH_PROVIDER`
- `SEARCH_API_KEY`
- `SEARCH_BASE_URL`

### Deployment and Frontend API Base

- `NEXT_PUBLIC_API_BASE_EXTERNAL`
- `NEXT_PUBLIC_API_BASE`

### Authentication

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`

### Stripe Billing

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_TEAM_PRICE_ID`

### Security and Networking

- `DISABLE_SSL_VERIFY`

## Notes for SaaS Wrapper Work

- Clerk auth is wired in `web/app/layout.tsx`, and `web/middleware.ts` protects every non-public route with `auth.protect()`
- Stripe billing foundations live in `web/lib/billing.ts`, `web/lib/limits.ts`, `web/lib/db.ts`, and `web/app/api/webhooks/stripe/route.ts`
- The existing shared shell is sidebar-driven, so auth controls will need to be introduced into a shared layout or sidebar component
- The Python backend should remain untouched for this wrapper pass because the requested SaaS setup is isolated to `web/`
