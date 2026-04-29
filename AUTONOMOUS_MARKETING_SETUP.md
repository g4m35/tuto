# Autonomous Marketing Setup

Updated: 2026-04-29

This repo now has the in-app plumbing for beta capture and marketing events. External tools still need account credentials in production env vars.

## What Is Already Wired

- Public landing page at `/`.
- SEO landing variants at `/pdf-to-course`, `/ai-study-course`, and `/training-docs-to-course`.
- `robots.txt` and `sitemap.xml`.
- Beta signup form posting to `/api/beta-signups`.
- Marketing event endpoint at `/api/marketing/events`.
- Postgres tables in `web/migrations/006_marketing.sql`.
- Optional PostHog forwarding from the server.
- Optional beta-signup webhook for Zapier, n8n, Make, HubSpot, Customer.io, or a custom worker.
- Launch-health check for beta signup capture and PostHog forwarding.
- Operator dashboard at `/marketing` for configured admin users.
- CSV export at `/api/marketing/beta-signups/export` for configured admin users.

## Required Production Setup

1. Apply the new migration:

   ```bash
   psql "$DATABASE_URL" -f web/migrations/006_marketing.sql
   ```

2. Add env vars to the web service:

   ```bash
   POSTHOG_PROJECT_API_KEY=
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   BETA_SIGNUP_WEBHOOK_URL=
   BETA_SIGNUP_WEBHOOK_SECRET=
   ```

3. Keep `DATABASE_URL` or `POSTGRES_URL` configured. Postgres is the primary beta signup store.

4. Confirm `/api/health` reports `marketing` as pass.

5. Set at least one operator admin so `/marketing` can be opened in production:

   ```bash
   TUTO_ADMIN_EMAILS=you@example.com
   ```

## PostHog Setup

Create a PostHog project for Tuto and copy the project API key into `POSTHOG_PROJECT_API_KEY`.

The landing page currently captures:

- `landing_page_viewed`
- `hero_create_course_clicked`
- `hero_beta_clicked`
- `pricing_cta_clicked`
- `beta_signup_started`
- `beta_signup_completed`
- `beta_signup_failed`
- `course_create_page_viewed`
- `course_create_mode_selected`
- `course_create_file_selected`
- `course_create_started`
- `course_create_completed`
- `course_create_failed`
- `course_create_limit_hit`
- `pricing_page_viewed`
- `checkout_started`
- `checkout_failed`
- `checkout_blocked`
- `billing_portal_started`
- `billing_portal_failed`

Recommended PostHog funnels:

- Landing page viewed -> Create course clicked -> Signup -> Course created.
- Landing page viewed -> Beta signup completed.
- Landing page viewed -> Pricing clicked -> Checkout started -> Paid.
- Course create page viewed -> Course create started -> Course create completed.
- Course create limit hit -> Pricing page viewed -> Checkout started.

## Zapier Or n8n Beta Signup Flow

Use `BETA_SIGNUP_WEBHOOK_URL` as the entry point.

Expected payload:

```json
{
  "email": "learner@example.com",
  "name": "Learner Name",
  "useCase": "Certification prep",
  "materialType": "PDF",
  "notes": "Studying cloud security docs first.",
  "marketingOptIn": true,
  "source": "landing_page",
  "metadata": {
    "page_url": "https://example.com/",
    "referrer": "https://google.com/"
  },
  "submitted_at": "2026-04-29T00:00:00.000Z"
}
```

Suggested workflow:

- Receive webhook.
- Add or update contact in Customer.io, HubSpot, or a sheet/CRM.
- Tag by `useCase` and `materialType`.
- If `marketingOptIn` is true, enroll in beta onboarding.
- Notify the operator in Slack/email for high-value use cases such as "Training docs" or "Tutoring or coaching".

## Customer.io Lifecycle Setup

Use the beta webhook or Postgres export to seed Customer.io contacts.

Initial segments:

- `beta_certification_prep`
- `beta_class_notes`
- `beta_training_docs`
- `beta_tutors_coaches`
- `marketing_opted_in`

Initial journeys:

- Beta welcome.
- "What material will you try first?"
- First-course nudge after signup without course creation.
- Course created but lesson not completed.
- Limit hit -> Pro education.

## Weekly Autonomous Workflows

### GTM Brief

Run weekly in Zapier Agents, n8n, or ChatGPT Tasks:

- Search competitor/product updates.
- Search learner pain phrases and community discussions.
- Summarize content ideas, objections, and landing-page copy opportunities.
- Send the brief to email or Notion.

### Content Production

Trigger from an approved content idea:

- Draft an article brief.
- Draft LinkedIn, X, short-video script, and newsletter snippets.
- Human approval before publishing.
- Schedule through Buffer or Hootsuite.

### AI Visibility

Run weekly:

- Query prompts like "best AI tool to turn PDFs into courses" and "AI tutor for my own notes".
- Record whether Tuto appears and which sources competitors cite.
- Turn missing angles into new landing sections or articles.

## Guardrails

Do not fully automate:

- Learning-outcome claims.
- Testimonials.
- Paid ads above a small daily cap.
- Cold outbound sends.
- Messaging to minors, schools, or parents.
- Anything touching billing, user accounts, or uploaded documents.

Fully automate:

- Event capture.
- Beta routing.
- Draft research briefs.
- Content repurposing after a human approves the source article.
- Weekly funnel reports.

## First Content Queue

Use `MARKETING_CONTENT_CALENDAR.md` for the first 30 days of content topics, repurposing prompts, and beta interview questions.
