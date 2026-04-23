# Roadmap

## Recently Completed

- [x] Course creation now provisions a real DeepTutor knowledge base for uploaded documents.
- [x] Upload flow waits for the knowledge base to become ready before starting guided learning.
- [x] Guided-learning sessions now persist and return `kb_name` so the KB-backed session survives after creation.

## Remaining Launch-Critical Work

- [ ] Build the self-serve pricing and checkout flow for Stripe.
- [ ] Add billing-management and downgrade UX for existing subscribers.
- [ ] Lock production deployment for this fork's Clerk + Stripe + Postgres requirements.
- [ ] Add monitoring, alerting, and a rollback runbook.
- [ ] Add web build and end-to-end launch-path testing.

See [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) for the operator runbook and pass/fail launch gates.
