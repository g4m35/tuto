# Tuto Marketing Plan

Researched and drafted: 2026-04-29

## Executive Direction

Tuto should launch as a focused product-led learning tool, not as a broad "AI tutor" clone. The clearest promise in the current app is:

> Turn your own PDFs, notes, or topic into a guided course with practice, review, and progress tracking.

This is more concrete than "AI tutor" and gives Tuto a wedge against generic chatbots, Khanmigo-style tutoring, Coursera Coach-style in-course help, and note-to-flashcard tools. The first market should be self-directed learners and professionals studying dense material: certification prep, continuing education, technical onboarding, college readings, and operator training packets.

Do not run a full paid launch until the remaining launch checklist items are closed: billing downgrade/cancel behavior, production deployment, monitoring, rollback, and one end-to-end signed-in purchase/course smoke test. Start with waitlist, closed beta, and founder-led onboarding while those are finalized.

## Positioning

### Primary Message

Tuto turns trusted material into a course that teaches, quizzes, and remembers where you need review.

### Why It Is Different

- It starts from the learner's own material, not a generic answer engine.
- It creates a course structure, not only a chat response.
- It supports practice and review from real course progress.
- It can grow into a deeper DeepTutor workspace: chat, deep solve, research, visualization, co-writing, books, skills, memory, and TutorBots.

### Avoid These Claims For Now

- Do not claim guaranteed grade, exam, or learning-outcome improvement without evidence.
- Do not position it for children or K-12 schools until privacy, safety, consent, and school procurement needs are explicitly handled.
- Do not market Team broadly until team billing and team-management UX exist.

## Ideal Customer Profiles

### ICP 1: Professional Learners

People studying for certifications, technical onboarding, licensing, sales enablement, internal tools, or new domains.

Pain: They have dense PDFs, notes, SOPs, or docs but no good practice loop.

Offer: "Upload your source and get a guided course in minutes."

Channels: SEO, Reddit, LinkedIn content, YouTube demos, certification communities, newsletter sponsorships.

### ICP 2: Students And Independent Learners

Students and independent learners with lecture notes, readings, syllabi, and online resources.

Pain: Notes are passive; ChatGPT gives answers, but does not become a course with review.

Offer: "Turn notes into lessons and practice questions before the exam."

Channels: TikTok/YouTube Shorts, student communities, campus ambassadors, search, AI tool directories.

### ICP 3: Tutors, Coaches, And Micro-Educators

Independent tutors, course creators, trainers, and coaches who want to turn source material into guided lessons.

Pain: Course prep and practice-question creation are time-consuming.

Offer: "Build a practice course from your material, then customize it for learners."

Channels: LinkedIn, creator newsletters, webinars, direct outreach, partnerships.

## Beachhead Recommendation

Start with learners, tutors, teams, schools, and companies that already have trusted material they need to study, teach, or operationalize. Keep claims conservative and make the product feel open to all learning contexts while giving institutions a clear Enterprise path.

## Launch Offer

Use a simple beta offer:

- Free account: enough credits to create the first course and experience one complete learning loop.
- Pro: $20/month for unlimited course creation, more knowledge bases, and unlimited guided practice.
- Founding learner bonus: first 100 paid users get direct onboarding and early influence over the roadmap.
- Team: shared-use billing for tutors, coaches, and cohort operators.
- Enterprise: contract-based access for schools and companies that need onboarding, larger usage, and a direct handoff.

## 90-Day Go-To-Market Plan

### Phase 0: Launch Readiness, Week 0-1

Goals: instrument the funnel, polish the public story, and avoid charging users before operational gaps are closed.

- Add public landing page instead of redirecting `/` straight to `/dashboard`.
- Add three landing variants: "PDF to course", "AI study course from notes", and "training material to guided practice".
- Add a waitlist or beta intake form with intended use case, material type, and willingness to pay.
- Instrument core events: signup, first course start, upload selected, topic selected, course created, first lesson started, first lesson completed, review started, limit hit, checkout started, checkout completed.
- Set up analytics, session replay, and error monitoring before paid traffic.
- Run final staging verification for Stripe checkout, billing portal, webhook tier update, cancellation, failed payment, and downgrade behavior.

### Phase 1: Closed Beta, Week 2-4

Goals: prove the activation loop and get language from real users.

- Recruit 30-50 beta users from professional learning communities.
- Do 15 live onboarding calls. Watch where users get stuck.
- Ask every beta user for the exact document/topic they tried, what they expected, what felt magical, and what was disappointing.
- Publish 5 short demo videos showing real workflows:
  - PDF to course
  - Lecture notes to practice
  - Certification study guide to review loop
  - Topic prompt to beginner course
  - Weak spot review after lesson progress
- Build a quote/testimonial bank, but only use testimonials with explicit permission and clear disclosure.

### Phase 2: Public Beta, Week 5-8

Goals: create a repeatable content and conversion engine.

- Open signups with a "public beta" label.
- Launch on Product Hunt, Hacker News "Show HN" if the product is robust enough, Indie Hackers, relevant subreddits, and AI tool directories.
- Start publishing 3 SEO/GEO articles per week:
  - "How to study a PDF with AI without losing the source"
  - "Best way to turn notes into practice questions"
  - "AI tutor vs AI course generator"
  - "How to learn from work docs faster"
  - "How to build a study plan from a long PDF"
- Syndicate each article into LinkedIn posts, short videos, newsletter snippets, and Reddit/community answers.
- Add lifecycle emails for: welcome, first course not created, course created but no lesson completed, limit hit, and Pro trial/upgrade.

### Phase 3: Paid Growth Tests, Week 9-12

Goals: test channels with small budgets and keep CAC discipline.

- Test search ads for high-intent terms around "turn PDF into course", "AI study guide", and "AI practice questions from notes".
- Test Reddit ads in professional learning and exam-prep communities only after organic posts identify winning angles.
- Test creator/newsletter sponsorships in AI learning, productivity, and professional certification niches.
- Run retargeting only after analytics proves first-course activation.
- Keep each test to a written hypothesis, budget cap, landing page, and kill metric.

## Recommended Autonomous Marketing Stack

Use the smallest stack that can run 24/7 and still leave consequential decisions to you.

### Foundation

- Analytics: PostHog for product analytics, funnels, session replay, feature flags, experiments, surveys, and AI/LLM feature tracking.
- Performance: Vercel Web Analytics and Speed Insights if deploying on Vercel.
- Lifecycle messaging: Customer.io for event-triggered onboarding, upgrade, retention, and reactivation emails.
- CRM: HubSpot if you want one all-in-one CRM and later Breeze agents; otherwise keep a lightweight CRM table until sales-led motion appears.
- Automation orchestrator: Zapier Agents for fastest setup; n8n if you want more technical control or self-hosting.

### Acquisition And Research

- Research assistant: ChatGPT Team/Business with connectors and deep research for positioning, competitor scans, and content briefs.
- AI search visibility: Ahrefs Brand Radar or Semrush AI Visibility Toolkit to track whether Tuto appears in ChatGPT, Gemini, Perplexity, Google AI results, and related answer engines.
- SEO: Google Search Console plus Ahrefs or Semrush.
- Social: Buffer for lightweight scheduling; Hootsuite/OwlyGPT if real-time social listening and trend-driven content become important.
- Newsletter: beehiiv if you want a media-style newsletter with growth loops; Customer.io if the newsletter is mostly product lifecycle.
- Lead research/outbound: Clay plus Apollo for tutor, coach, training, creator, and B2B lists. Keep human review before sending and make sure audience targeting stays appropriate for each channel.

### Customer Support And Feedback

- Support inbox: shared Gmail or Help Scout/Intercom when volume grows.
- Feedback: Tally or in-app surveys feeding PostHog/Notion/Linear.
- Call recording/summaries: Fathom, Granola, or Read.ai for beta calls.

## Automation Workflows

### 1. Weekly Market Intelligence Agent

Trigger: every Monday morning.

Steps:

- Pull competitor updates from Khanmigo, Coursera Coach, Quizlet, ChatGPT, Perplexity, Google AI search, and AI tutor directories.
- Search Reddit, YouTube, X, and Google for learner pain phrases.
- Summarize: new competitor features, recurring user complaints, content ideas, and landing page copy opportunities.
- Output to a "Weekly GTM Brief" doc.
- Human checkpoint: approve which insights become content or product work.

### 2. Content Production Agent

Trigger: approved content idea.

Steps:

- Generate content brief with ICP, search intent, target query, objections, and product demo angle.
- Draft article, LinkedIn post, short video script, newsletter section, and community answer.
- Run quality pass against Google helpful-content criteria: original experience, clear value, source-grounded claims, no filler.
- Human checkpoint: approve final copy and any product/learning claims.
- Schedule through Buffer/Hootsuite and newsletter tool.

### 3. AI Search Visibility Agent

Trigger: weekly.

Steps:

- Run saved prompts like "best AI tool to turn PDFs into courses", "AI tutor for my own notes", and "create practice questions from PDF".
- Track whether Tuto appears, which competitors appear, and what sources are cited.
- Recommend content updates and new comparison pages.
- Output a short "AI visibility delta" report.

### 4. Lifecycle Messaging Agent

Trigger: product events.

Steps:

- If user signs up but does not create a course in 24 hours, send one example-based nudge.
- If user uploads material but course generation fails, send support-oriented recovery email.
- If user creates a course but does not complete a lesson, send a direct resume link.
- If user hits a free limit, send a usage-specific upgrade prompt.
- If user completes first course loop, ask for feedback/testimonial permission.

Human checkpoint: approve copy and segmentation before enabling. Review metrics weekly.

### 5. Beta Feedback Agent

Trigger: new survey, support email, or call transcript.

Steps:

- Classify feedback into activation issue, course quality, billing, performance, unclear positioning, or feature request.
- Extract exact user language for marketing copy.
- Create a weekly summary: top blockers, top wow moments, top requested outcomes.
- Human checkpoint: decide product and marketing changes.

### 6. Outbound Partner Agent

Trigger: approved partner segment.

Steps:

- Build a list of tutors, study creators, certification coaches, bootcamp operators, and training consultants.
- Enrich with Clay/Apollo.
- Draft highly specific outreach based on public work, never scraped private data.
- Human checkpoint: approve every campaign and sample emails.
- Send compliant outreach with clear identification and unsubscribe.

## Autonomous Guardrails

Fully automate:

- Research collection.
- First-draft content briefs.
- Repurposing approved content into social/email formats.
- Scheduling approved posts.
- Funnel reports.
- Feedback tagging.
- Lifecycle emails after copy is approved.

Require human approval:

- Any claims about learning outcomes.
- Paid ads over a small daily cap.
- Influencer or testimonial posts.
- Cold outbound campaigns.
- Pricing changes.
- Messages to minors, schools, or parents.
- Content that names competitors critically.
- Any automation that touches user data, billing, or account status.

Avoid:

- Fake reviews, fake testimonials, fake social engagement, or AI-generated "users".
- Mass AI content with no original product demo, user evidence, or human editing.
- LinkedIn scraping/automation that violates platform rules.
- Sending commercial email without opt-out handling.

## Content Strategy

### Pillar 1: Learn From Your Own Material

Topics:

- "How to study a 100-page PDF"
- "Turn training docs into a learning path"
- "How to convert notes into practice questions"
- "The problem with asking ChatGPT to summarize everything"

Demo angle: upload source, generate course, complete first lesson.

### Pillar 2: Practice Beats Passive Notes

Topics:

- "Why summaries do not feel like studying"
- "How to build a review loop from your notes"
- "How to find weak spots before an exam"

Demo angle: course progress and review page.

### Pillar 3: AI Tutor vs AI Course Generator

Topics:

- "AI tutor vs AI flashcards vs AI course builder"
- "When to use ChatGPT, NotebookLM, Quizlet, Khanmigo, or Tuto"
- "What to look for in an AI study tool"

Demo angle: positioning Tuto as structured, material-grounded, and practice-oriented.

### Pillar 4: Builder-In-Public Launch

Topics:

- Product roadmap.
- Launch checklist progress.
- Real lessons from beta users.
- Before/after course generation examples.

Demo angle: transparency and trust.

## Channel Plan

### Highest Priority

- SEO/GEO content for high-intent learning workflows.
- Short product demos on YouTube Shorts, TikTok, LinkedIn, and X.
- Reddit/community participation where you answer learning workflow questions without spamming.
- Newsletter or email list from day one.
- Product-led lifecycle emails based on actual usage events.

### Medium Priority

- Product Hunt and Show HN once onboarding is solid.
- AI tool directories.
- Partnerships with study creators and certification educators.
- Small newsletter sponsorships.
- Search ads for high-intent keywords after conversion tracking is working.

### Low Priority For Now

- Broad paid social.
- School district sales.
- Large influencer campaigns.
- Team/enterprise outbound before team UX exists.

## Landing Page Requirements

The current app redirects `/` to `/dashboard`; marketing needs a public first impression.

Minimum landing page sections:

- Hero: "Turn any PDF or topic into a guided course."
- Primary CTA: "Create your first course."
- Secondary CTA: "Join the beta" if launch readiness is incomplete.
- 60-second product demo video or GIF.
- Three use cases: certification prep, class notes, training docs.
- How it works: upload material, generate course, practice, review weak spots.
- Pricing: free starter plus Pro at $20/month; Team waitlist.
- Trust: privacy posture, source-grounded learning, no fake outcomes.
- FAQ: supported file types, privacy, what happens to uploads, billing, limits.

## Metrics

### Activation

- Signup to first course started.
- First course started to course created.
- Course created to first lesson completed.
- Time to first course created.
- Course generation failure rate.

### Conversion

- Free user to limit hit.
- Limit hit to checkout start.
- Checkout start to paid.
- Paid conversion by source.

### Retention

- D1, D7, D30 active learner retention.
- Courses created per active user.
- Lessons completed per course.
- Review sessions per active user.

### Acquisition

- Organic search impressions and clicks.
- AI answer-engine mentions.
- Newsletter signup rate.
- Landing page conversion by message.
- CAC by paid channel.

## Budget Options

### Lean: $150-$300/month

- PostHog free tier.
- Customer.io or beehiiv starter tier.
- Buffer starter tier.
- ChatGPT Team/Business or equivalent research assistant.
- Google Search Console plus free Ahrefs/Semrush checks.

### Balanced: $500-$1,500/month

- PostHog plus usage.
- Customer.io.
- Ahrefs or Semrush.
- Hootsuite if social listening matters.
- Small newsletter sponsorships or search ad tests.

### Growth: $2,000+/month

- HubSpot/Customer.io plus dedicated AI visibility tooling.
- Clay/Apollo for partner and B2B outreach.
- Paid search/social testing.
- Creator sponsorships.
- Part-time video editor or content operator.

## First 14 Days Checklist

- [ ] Close the launch-critical billing/deployment/monitoring gaps or label launch as beta.
- [x] Add a public landing page.
- [x] Add waitlist/beta intake.
- [x] Instrument product events.
- [ ] Install analytics/session replay.
- [x] Write 10 user interview prompts.
- [ ] Recruit first 30 beta users.
- [ ] Produce 5 demo clips.
- [ ] Publish 3 high-intent articles.
- [ ] Set up lifecycle emails for signup, activation, and limit-hit.
- [ ] Create weekly GTM brief automation.
- [ ] Create feedback tagging automation.

Implementation note: repo-side setup now lives in `web/app/page.tsx`, `web/components/marketing/LandingPageClient.tsx`, `web/app/api/beta-signups/route.ts`, `web/app/api/marketing/events/route.ts`, `web/lib/marketing.ts`, and `web/migrations/006_marketing.sql`. External account setup is documented in `AUTONOMOUS_MARKETING_SETUP.md`.

Content note: the first 30-day queue, repurposing prompts, and beta interview prompts are in `MARKETING_CONTENT_CALENDAR.md`.

## Source Notes

- HubSpot Breeze Agents are positioned as function-specific agents across marketing, sales, and service inside the CRM: https://www.hubspot.com/products/artificial-intelligence/breeze-ai-agents
- Zapier Agents can automate work across connected apps, and Zapier's AI Guardrails can screen outputs for PII, prompt injection, sentiment, and toxicity: https://help.zapier.com/hc/en-us/articles/24393442652557-Build-an-agent-in-Zapier-Agents and https://help.zapier.com/hc/en-us/articles/43960576956301-Screen-AI-output-for-safety-and-compliance-with-AI-Guardrails-by-Zapier
- n8n AI Agents can query APIs, update CRMs, send emails, and file reports, making it a strong technical orchestration option: https://n8n.io/ai-agents/
- Clay supports AI-powered lead enrichment and research through Claygent: https://www.clay.com/use-cases/inbound-enrichment
- Apollo describes AI sales prospecting as automating lead identification, research, personalization, and outreach: https://www.apollo.io/insights/ai-for-sales-prospecting
- Customer.io Journeys supports event-triggered lifecycle messaging across email, push, in-app, and SMS: https://customer.io/platform/journeys
- Hootsuite OwlyGPT is a social AI assistant using social and brand context: https://www.hootsuite.com/platform/ai-assistant
- beehiiv expects AI personalization, onboarding automation, and cross-channel syndication to be standard for growth-minded newsletters in 2026: https://www.beehiiv.com/blog/beehiiv-the-state-of-newsletters-2026
- Semrush AI Visibility Toolkit and Ahrefs Brand Radar/AI Visibility Checker monitor brand presence in AI-generated answers: https://www.semrush.com/kb/1493-ai-visibility-toolkit and https://ahrefs.com/ai-visibility-checker
- PostHog covers product analytics, session replay, feature flags, experiments, surveys, and AI-assisted product analysis: https://posthog.com/
- Vercel Speed Insights tracks Core Web Vitals for deployed sites: https://vercel.com/docs/speed-insights
- FTC CAN-SPAM guidance requires clear opt-out mechanisms and says companies remain responsible for vendors sending on their behalf: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- FTC review/testimonial guidance warns against fake or deceptive reviews and testimonials: https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers
- Google Search guidance prioritizes helpful, reliable, people-first content over content created to manipulate rankings: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Competitive context: Khanmigo emphasizes Socratic tutoring rather than answer-giving, while Coursera Coach is anchored inside Coursera course content: https://www.khanmigo.ai/ and https://www.coursera.org/explore/coach
