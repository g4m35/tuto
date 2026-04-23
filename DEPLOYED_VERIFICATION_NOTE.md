# Deployed Verification Note

## Current status

- Vercel project linked from `web/` as project `web`
- Latest ready preview: `https://web-82hxrih96-jaky.vercel.app`
- Verified with Vercel-authenticated requests:
  - `/pricing` returns `200`
  - `/support` returns `200`
  - `/sign-in` returns `200`
  - Protected routes such as `/dashboard` and billing POST routes are intercepted by Clerk in signed-out mode
- Real paid-flow verification still requires hosted Postgres and Stripe env vars

## Post-deploy checks

- Confirm `/pricing`, `/support`, `/privacy`, `/terms`, and `/refund-policy` return `200`
- Confirm `/dashboard` redirects signed-out browser sessions to Clerk sign-in
- Confirm checkout redirects into Stripe Checkout for signed-in users
- Confirm Stripe webhooks reach `/api/webhooks/stripe`
- Confirm `users` table updates after a successful checkout event

## Security and ops reminders

- Keep Clerk and Stripe secrets only in Vercel environment settings
- Use the deployed domain in Clerk allowed origins/redirects
- Re-run DB migrations before turning on real billing
- Monitor `support@tuto.app` once payments are enabled
- Browser-level verification through the desktop automation tool is still blocked until Codex has Accessibility and Screen Recording permissions
