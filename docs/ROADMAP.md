# Warrant — Roadmap

> Consolidated status, blockers, and next steps.
> Last updated: Feb 13, 2026

---

## 1. What's Done

**Live URL:** https://warrant.ink
**Database:** Neon Postgres (connected via Vercel Marketplace)
**Unit Tests:** 142 passing (`npm run test`)
**E2E Tests:** 32 passing (`npm run test:e2e`) — Playwright, Flows 1-8 from runbook
**Build:** Passing (`npm run build`)

### Features

| Feature | Route | Status |
|---------|-------|--------|
| Homepage | `/` | SSR, hero, CTAs, principles |
| Feed | `/feed` | 3 articles, ranked/latest/trending, integrity labels |
| Article detail | `/article/[slug]` | Paywall, source citations, corrections, read tracking |
| Login | `/auth/login` | Magic link form, rate-limited (per-email, per-IP, global) |
| Email verify | `/auth/verify` | Token verification + session creation |
| Subscribe | `/subscribe` | $5/mo + $50/yr pricing cards, Stripe Checkout (dynamic payment methods) |
| Subscribe success | `/subscribe/success` | Post-checkout confirmation with session details, manage link |
| Search | `/search` | UI + Meilisearch sync on publish/update/integrity changes |
| Apply | `/apply` | Contributor application form |
| Feedback | `/feedback` | Feature requests + voting |
| Bookmarks | `/bookmarks` | Auth-protected |
| Author profile | `/author/[id]` | Bio, reputation, articles |
| Journalist dashboard | `/journalist/dashboard` | Auth-protected, article list |
| Article editor | `/journalist/write` | Tiptap rich text editor, source fields, save/publish |
| Journalist revenue | `/journalist/revenue` | Revenue history, paid/pending earnings |
| Admin dashboard | `/admin` | Stats, flag queue, disputes |
| Admin flags | `/admin/flags` | Flag review with uphold/dismiss + review notes |
| Admin disputes | `/admin/disputes` | Dispute queue |
| Settings | `/settings` | Profile editing, Identity verification, Stripe Connect onboarding, Manage Subscription (Customer Portal) |
| Terms | `/terms` | Terms of Service page |
| Privacy | `/privacy` | Privacy Policy page |
| Transparency | `/transparency` | Transparency page |
| Integrity | `/integrity` | Integrity Standards page |
| All API routes | `/api/*` | 25+ route handlers (incl. portal, session, webhooks) |

### Execution Status

| Area | Status | Notes |
|------|--------|-------|
| Security hardening | Done | All 5 audit findings addressed; abuse-case tests added |
| Stripe Identity flow | Done | API + UI + webhook + status handling |
| Stripe Connect/payout flow | Done | API + UI + webhook + admin payout endpoint |
| Search sync lifecycle | Done | Sync on publish/update/integrity; backfill script |
| Legal pages | Done | 4 pages with placeholder content; linked from footer |
| Revenue signal | Done | Read tracking + audit-based revenue calculation |
| Playwright E2E | Done | 32 tests covering Flows 1-8 from E2E runbook |
| Stripe Billing completeness | Done | Customer Portal, dynamic payment methods, session_id success page, invoice.paid/failed webhooks |

### Services Configured

| Service | Status | Details |
|---------|--------|---------|
| **Vercel** | Production | Project: `warrant`, auto-deploy via CI |
| **Neon Postgres** | Connected | Via Vercel Marketplace, all envs |
| **Stripe** | Test Mode | Checkout, Identity verification, Connect payouts, webhook handler |
| **Stripe Webhook** | Configured | Handles checkout, subscription (created/updated/deleted/trial), invoice (paid/failed), identity, connect events |
| **Resend** | API key set | Using `onboarding@resend.dev` (test domain — only delivers to account owner) |
| **Redis** | Local only | Docker Compose for dev, no production instance |
| **Meilisearch** | Local only | Docker Compose for dev, no production instance |

### Environment Variables on Vercel

All set for Production + Preview:
- `DATABASE_URL` (+ Neon pool vars)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_ANNUAL_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_PROVIDER`
- `PLATFORM_MARGIN`, `STRIPE_IDENTITY_ENABLED`

**Not yet set:** `REDIS_URL`, `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`

---

## 2. Infra Blockers (Manual Provisioning Required)

All items below are **code-complete** (env var wiring, client libraries, fallback behavior). The actual external service provisioning requires manual action outside the codebase.

### Resend Custom Domain

- [ ] Custom sending domain verified in Resend
- [ ] `EMAIL_FROM` updated to verified domain address
- [ ] Non-owner test inbox receives login magic link

**Problem:** Magic link email only delivers to Resend account owner. Currently using `onboarding@resend.dev`.
**Fix:** Add a custom domain at https://resend.com/domains, verify DNS records (MX, TXT for SPF/DKIM), update `EMAIL_FROM` on Vercel.
**Effort:** ~15 min (mostly DNS propagation wait)

### Redis (Production)

- [ ] Production Redis instance provisioned
- [ ] `REDIS_URL` set in Vercel for Production + Preview
- [ ] Login and flag throttling path confirmed active

**Problem:** Sessions hit the database on every request without caching. Rate limiting relies on Redis.
**Fix:** Add Upstash Redis via Vercel Marketplace, set `REDIS_URL`, redeploy.
**Effort:** ~15 min

### Meilisearch (Production)

- [ ] Production Meilisearch instance provisioned
- [ ] `MEILISEARCH_HOST` + `MEILISEARCH_API_KEY` set in Vercel
- [ ] `npm run search:backfill` executed against production content set

**Problem:** Search page exists but articles aren't synced to any search index in production.
**Fix:** Create Meilisearch Cloud instance, set env vars on Vercel, run backfill.
**Effort:** ~30 min

### Verification Endpoint

- [x] Integration status endpoint: `/api/system/integrations` — returns configured/unconfigured status for all services.

---

## 3. Polish Items

### Legal Page Content
The `/terms`, `/privacy`, `/transparency`, and `/integrity` pages exist but contain placeholder-grade content (2 short sections each). Real legal review is needed before launch.

### Custom Domain
- Purchase and configure domain
- Add to Vercel project settings
- Update `NEXT_PUBLIC_APP_URL`
- Verify domain with Resend for branded emails
- Update Stripe webhook endpoint URL

### More Seed Data
Currently 3 published articles. For realistic testing need 20-30+. Expand `prisma/seed.ts`.

---

## 4. Contribution Infrastructure (Future)

Items to consider as the contributor base grows. All are code-complete or trivially addable — deferred because they add friction or complexity that isn't justified at current scale.

| Item | Why Deferred | When to Revisit |
|------|-------------|-----------------|
| **CODE_OF_CONDUCT.md** | Standard for larger communities (Contributor Covenant). Not urgent for a solo-maintained project. | Before active recruitment of outside contributors |
| **DCO / CLA** | Developer Certificate of Origin or Contributor License Agreement. Relevant for AGPL projects if dual-licensing is ever considered. | If licensing strategy changes or corporate contributors appear |
| **Signed commits requirement** | Adds friction to every commit. Overkill for a small contributor pool. | When contributor count exceeds ~5 or security posture demands it |
| **E2E tests in CI** | Playwright tests require Docker services (Postgres, Redis, Meilisearch). Would need a complex CI matrix with service containers. Unit tests + build are sufficient gatekeeping for now. | When CI budget allows or a flaky-test-free E2E suite is worth the cost |
| **Dependabot / Renovate** | Automated dependency update PRs. Useful but noisy — better to enable once CI is battle-tested. | After branch protection and CI are stable for ~1 month |
| **Branch naming conventions** | Enforce patterns like `feature/*`, `fix/*` via ruleset. Low priority while contributor count is small. | When PRs from external contributors start arriving |

---

## 5. Technical Notes

### Key Files
- `src/lib/db.ts` — Prisma client with `pg` driver adapter (required for Prisma 7)
- `src/lib/auth.ts` — Magic link creation, verification, session management
- `src/lib/email.ts` — Dual provider (Resend prod / Mailpit dev), auto-detects
- `src/lib/stripe.ts` — Stripe client + checkout/portal/identity/connect/webhook helpers
- `src/lib/search.ts` — Meilisearch sync, indexing, and search operations
- `src/lib/redis.ts` — Redis cache + rate limiting (sliding window)
- `src/middleware.ts` — Security headers, CSRF protection, session shape validation, route protection
- `src/services/distribution.ts` — Feed ranking algorithm
- `src/services/integrity.ts` — Reputation scoring, source assessment, content risk assessment
- `src/services/revenue.ts` — Revenue calculation with Gini coefficient, read-based allocation
- `prisma/schema.prisma` — Full database schema

### Known Quirks
- **Prisma 7 requires `pg` adapter** — Can't just pass a connection string, must create a `Pool` then `PrismaPg(pool)`
- **Zod v4** — Uses `.issues` not `.errors` for validation error access
- **Next.js 16** — `useSearchParams()` must be wrapped in `<Suspense>`; shows "proxy" deprecation warning for middleware (still works)
- **`tsconfig.json` excludes** — Test files + seed script excluded from Next.js build to avoid type conflicts
- **Email provider auto-detection** — Defaults to `resend` in production, `mailpit` in development (via `NODE_ENV`)

### Dev Login

Visit **http://localhost:3000/auth/dev-login** to instantly log in as any seeded account (admin, journalist, reader) with one click. No email or magic link needed.

- Double-gated: page renders "Not available" in production, and the backing API (`/api/auth/login/test`) returns 404 in production.
- After `db:reset`, the seed prints cookie-ready session tokens to the console if you need them for manual curl testing.

### Commands
```bash
# Deploy
npx vercel deploy --prod

# Local dev
docker compose up -d    # Start Postgres, Redis, Meilisearch, Mailpit
npm run dev             # Start Next.js dev server
npm run test            # Run 142+ unit tests
npm run test:e2e        # Run 32+ Playwright E2E tests
npm run db:reset        # Reset + re-seed database
npm run search:backfill # Backfill Meilisearch index
```
