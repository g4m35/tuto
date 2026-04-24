# Operations Runbook

This runbook is the shortest operator path for deploy day, rollback, health checks, and database safety on the hosted `tuto.chat` launch.

## 1. Production Web Health

The web app now exposes a consolidated launch-health endpoint:

- `GET /api/health`
- `GET /api/health/deeptutor`

`/api/health` reports:

- app URL configuration
- Postgres reachability
- Stripe billing configuration presence
- recent failed Stripe webhook events from the last 24 hours
- DeepTutor backend reachability and model readiness

Healthy production should return:

- HTTP `200`
- `"status": "ok"` or `"status": "degraded"`

HTTP `503` means a required dependency is down or missing.

## 2. Deploy-Day Order

1. Confirm Vercel production environment variables are present.
2. Confirm backend production environment variables are present.
3. Apply web database migrations:

```bash
./scripts/apply_web_migrations.sh
```

4. Run the production smoke suite:

```bash
./scripts/production_smoke.sh
```

5. Confirm `https://tuto.chat/api/health` reports no failed required checks.
6. Confirm recent Stripe webhook deliveries are green in the Stripe dashboard.

If the backend has a different public URL, include it when smoking production:

```bash
BACKEND_URL="https://your-backend-domain" ./scripts/production_smoke.sh
```

## 3. Backup Before Risky Changes

Before changing billing logic, migrations, or database structure, take a fresh Postgres backup:

```bash
./scripts/backup_postgres.sh
```

Optional custom output path:

```bash
./scripts/backup_postgres.sh /secure/location/tuto-prelaunch.dump
```

The backup script requires `DATABASE_URL` or `POSTGRES_URL`.

## 4. Restore Drill

Never restore into production blindly. Restore into staging or a temporary recovery database first.

```bash
CONFIRM_RESTORE=I_UNDERSTAND_THIS_OVERWRITES_DATA \
TARGET_DATABASE_URL="postgres://..." \
./scripts/restore_postgres.sh /path/to/backup.dump
```

The restore script is intentionally gated behind the explicit confirmation token.

## 5. Rollback

If a web deploy breaks production:

1. Open the Vercel `web` project.
2. Find the last known-good production deployment.
3. Redeploy or promote that known-good build.
4. Run `./scripts/production_smoke.sh` again.
5. Check `https://tuto.chat/api/health` and recent Stripe webhook deliveries.

If a database migration is the problem:

1. Stop applying additional schema changes.
2. Restore the latest known-good backup into a staging target first.
3. Validate course reads, billing rows, and webhook event history there.
4. Only then schedule the production restore if needed.

## 6. Incident Triage

Check in this order:

1. `https://tuto.chat/api/health`
2. `https://tuto.chat/api/health/deeptutor`
3. Stripe webhook deliveries
4. latest Vercel production deployment
5. backend logs for LLM, embedding, KB, or session-start failures
6. Postgres connectivity and recent write failures

## 7. External Items That Still Require Human Setup

These are outside the repo and still have to stay true:

- Vercel production envs remain current
- Clerk production domains remain correct
- Stripe live products, prices, and webhook endpoint remain active
- hosted Postgres backups and retention remain enabled with your database provider
- someone owns support mail and billing response handling
