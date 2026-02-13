# Free Press — Next Steps

> Context document for continuing development in a new session.
> Last updated: Feb 13, 2026

## Current State

**Live URL:** https://freepress-snowy.vercel.app
**Repo:** `/Users/connormullins/Code/free_press`
**Database:** Neon Postgres (connected via Vercel Marketplace)
**Tests:** 136 passing (`npm run test`)
**Last commit:** `feat: complete Free Press platform - full-stack implementation`

### What's Working in Production

| Feature | Route | Status |
|---------|-------|--------|
| Homepage | `/` | ✅ SSR, hero, CTAs, principles |
| Feed | `/feed` | ✅ 3 articles, ranked/latest/trending, integrity labels |
| Article detail | `/article/[slug]` | ✅ Paywall, source citations, corrections |
| Login | `/auth/login` | ✅ Magic link form, creates user + token in DB |
| Email verify | `/auth/verify` | ✅ Token verification page |
| Subscribe | `/subscribe` | ✅ $5/mo + $50/yr pricing cards |
| Search | `/search` | ✅ UI ready (Meilisearch sync pending) |
| Apply | `/apply` | ✅ Contributor application form |
| Feedback | `/feedback` | ✅ Feature requests + voting |
| Bookmarks | `/bookmarks` | ✅ Auth-protected |
| Author profile | `/author/[id]` | ✅ Bio, reputation, articles |
| Journalist dashboard | `/journalist/dashboard` | ✅ Auth-protected |
| Article editor | `/journalist/write` | ✅ Basic form (needs Tiptap upgrade) |
| Admin dashboard | `/admin` | ✅ Stats, flag queue, disputes |
| Settings | `/settings` | ✅ Auth-protected |
| All API routes | `/api/*` | ✅ 18 route handlers |

### Services Configured

| Service | Status | Details |
|---------|--------|---------|
| **Vercel** | ✅ Production | Project: `free_press`, auto-deploy via CLI |
| **Neon Postgres** | ✅ Connected | Via Vercel Marketplace, all envs |
| **Stripe** | ✅ Test Mode | Prices: `price_1Qn6AtRsmcGBiWmKaFYTrpq2` (monthly), `price_1Qn6AtRsmcGBiWmK1xVJWXoP` (annual) |
| **Stripe Webhook** | ✅ Configured | Endpoint: `https://freepress-snowy.vercel.app/api/webhooks/stripe` |
| **Resend** | ✅ API key set | Using `onboarding@resend.dev` (test domain — only delivers to account owner) |
| **Redis** | 🔴 Local only | Docker Compose for dev, no production instance |
| **Meilisearch** | 🔴 Local only | Docker Compose for dev, no production instance |

### Key Environment Variables on Vercel

All set for Production + Preview:
- `DATABASE_URL` (+ Neon pool vars)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_ANNUAL_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_PROVIDER`
- `PLATFORM_MARGIN`, `STRIPE_IDENTITY_ENABLED`

**Not yet set:** `REDIS_URL`, `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`

---

## Priority 1: Complete Core User Flows

These are the gaps that prevent end-to-end user testing:

### 1. Email Delivery (Blocking Login Flow)
**Problem:** Resend is configured with the test domain (`onboarding@resend.dev`), which only delivers emails to the Resend account owner's email address. Real users can't receive magic link emails.
**Fix:**
- Add a custom domain in Resend (https://resend.com/domains)
- Verify DNS records (MX, TXT for SPF/DKIM)
- Update `EMAIL_FROM` env var on Vercel to `noreply@yourdomain.com`
- Test with a non-account-owner email
**Effort:** ~15 min (mostly DNS propagation wait)

### 2. Interactive Rich Text Editor
**Problem:** The journalist write page (`/journalist/write`) has a basic textarea. The article rendering supports Tiptap JSON, but there's no interactive Tiptap editor for creating content.
**Fix:**
- Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*` packages
- Replace the textarea in `/journalist/write` with a full Tiptap editor
- Add toolbar (bold, italic, headings, blockquotes, code blocks, links)
- Output Tiptap JSON for storage, plain text for `contentText` field
**Effort:** ~2-3 hours

### 3. Stripe Checkout Flow (End-to-End)
**Problem:** Subscribe page shows pricing cards but clicking "Subscribe" calls `/api/subscribe` which creates a Stripe Checkout session. This has been verified at the API level but not browser-tested end-to-end.
**Fix:**
- Test the full flow: click Subscribe → Stripe Checkout → webhook → subscription active
- Verify the paywall unlocks for subscribed users
- Test with Stripe test cards (`4242 4242 4242 4242`)
**Effort:** ~30 min of testing

---

## Priority 2: Production Infrastructure

### 4. Redis for Production
**Why:** Sessions currently hit the database on every request. Rate limiting is defined in code but not active without Redis.
**Options:**
- **Upstash Redis** (serverless, Vercel integration, free tier) — recommended
- **Redis Cloud** (managed)
- **Railway Redis**
**Fix:** Add via Vercel Marketplace → set `REDIS_URL` → redeploy
**Effort:** ~15 min

### 5. Meilisearch for Production
**Why:** Search page exists but articles aren't synced to any search index in production.
**Options:**
- **Meilisearch Cloud** (official hosted, free tier for testing)
- **Railway** or self-hosted
**Fix:**
- Create Meilisearch Cloud instance
- Set `MEILISEARCH_HOST` and `MEILISEARCH_API_KEY` on Vercel
- Add article sync logic (on publish/update/delete)
- Backfill existing articles
**Effort:** ~1-2 hours

---

## Priority 3: Revenue & Payouts

### 6. Stripe Connect for Journalist Payouts
**Why:** Revenue calculation engine exists but journalists can't actually receive money. Need Stripe Connect onboarding.
**Fix:**
- Enable Stripe Connect on your Stripe account
- Build Connect onboarding flow (journalist settings → Stripe Connect OAuth)
- Add payout API endpoint
- Build journalist revenue dashboard showing earnings, reads, payout status
**Effort:** ~4-6 hours

### 7. Monthly Payout Calculation Job
**Why:** `src/services/revenue.ts` has the calculation logic (reads × integrity × Gini correction) but there's no scheduled job to run it.
**Fix:**
- Create a Vercel Cron Job (or manual admin trigger)
- Calculate payouts for the month
- Create Stripe transfers to Connected accounts
- Record in `RevenueLedger` table
**Effort:** ~2-3 hours

---

## Priority 4: Testing & Polish

### 8. E2E Tests with Playwright
**Why:** 136 unit tests cover business logic but no browser-level flow tests exist.
**Fix:**
- Playwright is already a dev dependency
- Write tests for: Reader signup → subscribe → read article → flag
- Write tests for: Journalist login → write article → publish
- Write tests for: Admin → review flag → apply label
**Effort:** ~3-4 hours

### 9. More Seed Data
**Why:** Currently 3 published articles. For realistic testing need 20-30+.
**Fix:** Expand `prisma/seed.ts` with more diverse topics, varied integrity states, more journalists
**Effort:** ~1-2 hours

### 10. Admin Dashboard Polish
**Why:** Admin pages exist but are functional, not polished. Need charts, bulk actions, filtering.
**Fix:** Add stats charts (articles/day, flags/day), bulk flag resolution, user management
**Effort:** ~3-4 hours

---

## Priority 5: Pre-Launch

### 11. Custom Domain
- Purchase and configure domain
- Add to Vercel project settings
- Update `NEXT_PUBLIC_APP_URL`
- Verify domain with Resend for branded emails
- Update Stripe webhook endpoint URL

### 12. Legal Pages
- Footer links to `/terms`, `/privacy`, `/transparency`, `/integrity` currently 404
- Need Terms of Service, Privacy Policy, Transparency Report, Integrity Standards pages

### 13. Rate Limiting
- Redis-based rate limiting logic exists in `src/lib/redis.ts`
- Needs Redis production instance (see #4) to activate
- Apply to: login, article creation, flagging, feedback submission

### 14. Image Upload
- Articles are text-only currently
- Options: Vercel Blob, Cloudinary, S3
- Need upload component in editor + image rendering in article page

---

## Technical Notes for Next Session

### Key Files to Know
- `src/lib/db.ts` — Prisma client with `pg` driver adapter (required for Prisma 7)
- `src/lib/auth.ts` — Magic link creation, verification, session management
- `src/lib/email.ts` — Dual provider (Resend prod / Mailpit dev), auto-detects
- `src/lib/stripe.ts` — Stripe client + checkout/webhook helpers
- `src/middleware.ts` — Security headers + role-based route protection
- `src/services/distribution.ts` — Feed ranking algorithm
- `src/services/integrity.ts` — Reputation scoring (0-100)
- `src/services/revenue.ts` — Revenue calculation with Gini coefficient
- `prisma/schema.prisma` — Full database schema
- `prisma/seed.ts` — Seed data (uses same pg adapter pattern as db.ts)

### Known Quirks
- **Prisma 7 requires `pg` adapter** — Can't just pass a connection string, must create a `Pool` then `PrismaPg(pool)`
- **Zod v4** — Uses `.issues` not `.errors` for validation error access
- **Next.js 16** — `useSearchParams()` must be wrapped in `<Suspense>`; shows "proxy" deprecation warning for middleware (still works)
- **`tsconfig.json` excludes** — Test files + seed script excluded from Next.js build to avoid type conflicts
- **Email provider auto-detection** — Defaults to `resend` in production, `mailpit` in development (via `NODE_ENV`)

### Deploy Commands
```bash
npx vercel deploy --prod          # Deploy to production
npx vercel env add VAR production  # Add env var
npx vercel env ls                  # List env vars
npx vercel logs <url>              # Check deployment logs
```

### Local Dev Commands
```bash
docker compose up -d    # Start Postgres, Redis, Meilisearch, Mailpit
npm run dev             # Start Next.js dev server
npm run test            # Run 136 unit tests
npm run db:reset        # Reset + re-seed database
```
