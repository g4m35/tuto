# Roadmap

## Recently Completed

- [x] Course creation now provisions a real DeepTutor knowledge base for uploaded documents.
- [x] Upload flow waits for the knowledge base to become ready before starting guided learning.
- [x] Guided-learning sessions now persist and return `kb_name` so the KB-backed session survives after creation.
- [x] The app now has a self-serve pricing page and Stripe Checkout Session creation route.
- [x] Existing paid users can now manage billing through a self-serve portal from the pricing flow.
- [x] Shared billing helpers and focused node tests now cover billing helpers, webhook tier transitions, and cross-user course ownership.
- [x] CI now runs the `web` typecheck plus targeted node launch checks, and upstream-sync verification reports node tests, typecheck, and build separately.

## Remaining Launch-Critical Work

- [ ] Finalize cancel/downgrade policy and validate the billing-management flow in staging.
- [ ] Lock production deployment for this fork's Clerk + Stripe + Postgres requirements.
- [ ] Add monitoring, alerting, and a rollback runbook.
- [ ] Add a signed-in end-to-end launch smoke test for the real purchase/course path.

See [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) for the operator runbook and pass/fail launch gates.
