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

## DeepTutor API Surface

The `/deeptutor` backend does not expose a first-class `courses` API. The integration work in `web/` maps the existing DeepTutor primitives into a course-oriented wrapper.

### Running the backend locally

- Python entry point: `python -m deeptutor.api.run_server`
- Default backend port: `8001`
- Manual install path from the root README:
  - `pip install -e ".[server]"`
  - configure `.env` with at least LLM and embedding settings
- The FastAPI app is mounted in `deeptutor/api/main.py`, and CORS is already enabled for local frontend calls.

### Document ingestion

DeepTutor exposes knowledge-base ingestion, not a generic document API:

- `POST /api/v1/knowledge/create`
  - multipart form with `name` and one or more `files`
  - creates a new knowledge base, saves the uploaded files, and starts background indexing
  - returns a `task_id` for progress tracking
- `POST /api/v1/knowledge/{kb_name}/upload`
  - multipart form with `files`
  - appends files to an existing knowledge base
- `GET /api/v1/knowledge/list`
  - lists known knowledge bases and their status/progress
- `GET /api/v1/knowledge/tasks/{task_id}/stream`
  - server-sent events stream for ingestion logs

### Course or lesson generation

DeepTutor’s closest course primitive is Guided Learning:

- `POST /api/v1/guide/create_session`
  - body includes `user_input`
  - returns a `session_id` plus a flat `knowledge_points` array
- `POST /api/v1/guide/start`
  - body includes `session_id`
  - starts page generation and returns the initial lesson index plus progress
- `GET /api/v1/guide/session/{session_id}`
  - fetches persisted guided-learning session state
- `GET /api/v1/guide/session/{session_id}/pages`
  - returns page generation status and ready HTML pages

Important adaptation:

- Guided Learning returns a flat list of `knowledge_points`, not a nested course/unit/lesson tree.
- The web integration groups those points into UI “units” and persists them as course metadata on the frontend side.
- Guided Learning also does not accept knowledge-base IDs as a first-class retrieval parameter, so uploaded source IDs are preserved in web metadata and passed into the prompt context rather than attached as a dedicated backend field.

### Q&A

DeepTutor does not expose a standalone course Q&A route. The closest equivalent is guided-learning chat:

- `POST /api/v1/guide/chat`
  - body includes `session_id`, `message`, and optional `knowledge_index`
  - returns the reply for the current guided-learning session

### Exercise or quiz generation

There is no REST `generate exercise` endpoint. The relevant backend surface is the `deep_question` capability:

- `POST /api/v1/plugins/capabilities/deep_question/execute-stream`
  - server-sent events stream
  - accepts `content`, optional `knowledge_bases`, and `config`
  - for topic-driven generation, `config` can include `mode`, `topic`, `num_questions`, and `question_type`
- Legacy direct question generation also exists on WebSocket endpoints under `/api/v1/question/*`, but the capability SSE wrapper is easier to consume from the Next.js server routes.

Important adaptation:

- Adaptive lesson exercise generation in `web/` is implemented by calling `deep_question` for one choice question tied to the lesson title and summary.
- This is the closest existing backend equivalent to “generate next exercise”; it is not a dedicated lesson API in the Python service.

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

## DeepTutor Provider Resolution

- Embedding provider selection is resolved in `deeptutor/services/config/provider_runtime.py` via `EMBEDDING_PROVIDERS`, `_canonical_embedding_provider_name()`, `_resolve_embedding_provider()`, and `resolve_embedding_runtime_config()`.
- `deeptutor/services/embedding/config.py` calls that resolver through `get_embedding_config()` and is the runtime gate used by `/api/v1/system/status`, `/api/v1/system/test/embeddings`, and the RAG pipeline.
- Gemini embeddings are wired through the OpenAI-compatible Google endpoint with:
  - `EMBEDDING_BINDING=gemini`
  - `EMBEDDING_MODEL=gemini-embedding-001`
  - `EMBEDDING_HOST=https://generativelanguage.googleapis.com/v1beta/openai/`
  - `GOOGLE_API_KEY` as the shared Google credential fallback, without adding a separate embedding-only key
- Live verification note: on April 18, 2026, `text-embedding-004` returned `404 NOT_FOUND` from the Gemini API OpenAI-compatible endpoint, while `gemini-embedding-001` succeeded. `text-embedding-004` is still documented by Google under Vertex AI, not the Gemini API key path used by this backend.

### DeepTutor Smoke Commands

- Status:

```bash
curl -sS http://127.0.0.1:8001/api/v1/system/status
```

- Embeddings connectivity:

```bash
curl -sS -X POST http://127.0.0.1:8001/api/v1/system/test/embeddings
```

## Notes for SaaS Wrapper Work

- Clerk auth is wired in `web/app/layout.tsx`, and `web/middleware.ts` protects every non-public route with `auth.protect()`
- Stripe billing foundations live in `web/lib/billing.ts`, `web/lib/limits.ts`, `web/lib/db.ts`, and `web/app/api/webhooks/stripe/route.ts`
- The existing shared shell is sidebar-driven, so auth controls will need to be introduced into a shared layout or sidebar component
- The Python backend should remain untouched for this wrapper pass because the requested SaaS setup is isolated to `web/`
