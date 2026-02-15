# Warrant

**Integrity-enforced investigative journalism platform.**

A subscription-based platform where independent journalists publish first-hand investigative reporting. Revenue flows to journalists, not the platform. Integrity is enforced through reputation, not editorial control.

> **Production:** [warrant.ink](https://warrant.ink) | **Staging:** [dev.warrant.ink](https://dev.warrant.ink)

## Principles

- **Truth is a process, not a badge** — We use "supported," "disputed," and "insufficient sourcing" — never "verified true."
- **Verification is publication** — Any account that publicly validates a claim assumes the same responsibility as if it had published the claim itself.
- **Identity where it matters** — Readers can be pseudonymous. Revenue-earning contributors must be verified humans.
- **Incentives over intentions** — Revenue, distribution, and reputation are tied to demonstrated integrity.
- **Everything is auditable** — Every claim, edit, and action is attributable, versioned, and reversible.

## Tech Stack

- **Framework**: Next.js 16.1.6 (Turbopack, App Router)
- **Database**: PostgreSQL 16 + Prisma 7.4.0 (pg driver adapter)
- **Production DB**: Neon (serverless Postgres via Vercel)
- **Cache/Rate Limiting**: Redis (ioredis)
- **Search**: Meilisearch
- **Payments**: Stripe (subscriptions, Connect, Identity)
- **Email**: Resend (production) / Mailpit (local dev)
- **UI**: Radix UI + Tailwind CSS 4 + shadcn/ui
- **Testing**: Vitest + Testing Library (142 unit tests) + Playwright (32 E2E tests)
- **Validation**: Zod v4

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local services)
- A Stripe account (for payment features)

### 1. Clone and install

```bash
git clone https://github.com/connorpmullins/warrant.git
cd warrant
npm install
```

### 2. Start local services

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, Meilisearch, and Mailpit (email testing).

- **Mailpit UI**: http://localhost:8025 (view sent emails)
- **Meilisearch**: http://localhost:7700
- **PostgreSQL**: localhost:5432

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your values (Stripe keys, etc.)
```

### 4. Set up the database

```bash
npm run db:push    # Push schema to database
npm run db:seed    # Seed with sample data
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Quick login (dev only)

Visit [http://localhost:3000/auth/dev-login](http://localhost:3000/auth/dev-login) to instantly sign in as any seeded account with one click — no email or magic link needed.

Available accounts:

| Account | Email | Role |
|---------|-------|------|
| Admin | `admin@warrant.ink` | ADMIN |
| Journalist (E. Vasquez) | `elena.vasquez@example.com` | JOURNALIST |
| Journalist (M. Chen) | `marcus.chen@example.com` | JOURNALIST |
| Journalist (J. Wright) | `james.wright@example.com` | JOURNALIST |
| Journalist (P. Kapoor) | `priya.kapoor@example.com` | JOURNALIST |
| Journalist (C. Rivera) | `carlos.rivera@example.com` | JOURNALIST |
| Reader (subscribed) | `reader@example.com` | READER |
| Reader (free) | `free-reader@example.com` | READER |

> This page is double-gated: it renders "Not available" in production, and the backing API returns 404 in production.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # REST API endpoints
│   │   ├── admin/         # Admin stats, flags, disputes
│   │   ├── articles/      # Article CRUD + publish
│   │   ├── auth/          # Login, logout, verify, me
│   │   ├── bookmarks/     # User bookmarks
│   │   ├── corrections/   # Article corrections
│   │   ├── disputes/      # Moderation disputes
│   │   ├── feature-requests/ # Feedback system
│   │   ├── feed/          # Public feed (ranked/latest/trending)
│   │   ├── flags/         # Content flagging
│   │   ├── profile/       # Journalist profile management
│   │   ├── search/        # Meilisearch search
│   │   ├── subscribe/     # Stripe checkout, portal, session
│   │   └── webhooks/      # Stripe webhooks
│   ├── admin/             # Admin dashboard pages
│   ├── article/[slug]/    # Article detail page
│   ├── auth/              # Login + email verification pages
│   ├── author/[id]/       # Author profile page
│   ├── journalist/        # Journalist dashboard + article editor
│   ├── feed/              # Public feed page
│   ├── feedback/          # Feature request board
│   ├── search/            # Search page
│   ├── subscribe/         # Subscription pricing page
│   └── settings/          # User settings page
├── components/            # React components
│   ├── article/           # Article card
│   ├── editor/            # Rich text editor
│   ├── layout/            # Header, footer
│   └── ui/                # shadcn/ui components
├── lib/                   # Core utilities
│   ├── api.ts             # API response helpers
│   ├── audit.ts           # Audit logging
│   ├── auth.ts            # Magic link auth + sessions
│   ├── db.ts              # Prisma client (pg adapter)
│   ├── email.ts           # Email sending (Resend/Mailpit)
│   ├── redis.ts           # Redis client
│   ├── search.ts          # Meilisearch client
│   ├── stripe.ts          # Stripe client + helpers
│   └── validations.ts     # Zod schemas
├── services/              # Business logic
│   ├── distribution.ts    # Feed ranking algorithm
│   ├── integrity.ts       # Reputation scoring
│   └── revenue.ts         # Revenue calculation + Gini coefficient
├── instrumentation.ts     # Server startup hooks (Meilisearch init)
└── middleware.ts           # Security headers + route protection
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (auto-initializes Meilisearch indexes) |
| `npm run build` | Production build |
| `npm run test` | Run unit tests (Vitest) |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with sample data + sync to Meilisearch |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database, re-seed, and re-index search |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run setup` | Full setup script |

## Architecture

### Revenue Model

85% of subscription revenue flows to journalists, weighted by:
- Readership (article views)
- Integrity track record (reputation score)
- Gini coefficient correction (prevents winner-take-all)

### Integrity System

- **Reputation scoring** (0–100): Based on source quality, corrections, flags, and disputes
- **Integrity labels**: `SUPPORTED`, `DISPUTED`, `INSUFFICIENT_SOURCING`, `RETRACTED`
- **Distribution engine**: Higher-integrity articles get wider distribution
- **Correction system**: Voluntary corrections improve reputation; forced corrections reduce it
- **Flag & dispute pipeline**: Community flagging with admin review and journalist dispute rights

### Search (Meilisearch)

Search is powered by Meilisearch and kept in sync with Postgres automatically:

| Concern | Where | When |
|---|---|---|
| **Index settings** (filterable/sortable attrs) | `src/instrumentation.ts` | Every server start (`next dev` / `next start`) |
| **Bulk data sync** (seed data → search) | `prisma/seed.ts` | On `db:seed` / `db:reset` |
| **Real-time sync** (publish, edit, delete) | API routes (`publish`, `PATCH`, `DELETE`) | On each mutation |

No manual search initialization is needed. The Next.js instrumentation hook configures Meilisearch indexes on every server boot, and the seed script populates them with data. During normal operation, API routes keep the index current.

### Security

- Magic link authentication (no passwords)
- Session-based auth with secure httpOnly/sameSite cookies
- XSS protection via `sanitize-html`
- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- Role-based route protection via middleware
- Stripe webhook signature verification
- Input validation with Zod on all API endpoints

## Stripe Setup

To enable payment features, you'll need:

1. **Create a Stripe account** at [stripe.com](https://stripe.com)
2. **Get your API keys** from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
3. **Create two subscription prices**:
   - Monthly: $5/month
   - Annual: $50/year
4. **Configure the Customer Portal** at [Stripe Dashboard > Billing > Portal](https://dashboard.stripe.com/test/settings/billing/portal)
5. **Set up a webhook endpoint** pointing to `https://your-domain/api/webhooks/stripe` with events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `identity.verification_session.verified` (optional)
   - `identity.verification_session.requires_input` (optional)
   - `account.updated` (for Connect)
6. **Update `.env`** with your keys, price IDs, and webhook secret

## Environments

Three environments, three databases, three config sources:

| Environment | URL | Database | Config source |
|---|---|---|---|
| **Local** | `localhost:3000` | Docker Compose Postgres (`localhost:5432/warrant`) | `.env` file |
| **Staging** | `dev.warrant.ink` | Neon branch (Vercel Preview) | Vercel UI (Preview scope) |
| **Production** | `warrant.ink` | Neon production (Vercel Production) | Vercel UI (Production scope) |

### How env files work

- **`.env`** — Single source of truth for local development. Points at Docker Compose services (Postgres, Redis, Meilisearch, Mailpit). Copy from `.env.example` and fill in your Stripe keys.
- **`.env.example`** — Template with documentation. Committed to the repo.
- **`.env.vercel`** — Reference snapshot of Vercel env vars, generated by `vercel env pull .env.vercel`. Gitignored. Not loaded by Next.js.

> **Do not run `vercel env pull` into `.env.local`.** Next.js loads `.env.local` with highest priority, so it would silently override your local Docker config with remote Neon/Resend/Vercel settings. If you need Vercel env vars locally, pull them into `.env.vercel` instead.

### Deployment

The app is deployed on [Vercel](https://vercel.com) with:
- **Database**: Neon Postgres (connected via Vercel Marketplace)
- **Payments**: Stripe (test mode for staging, live for production)
- **Email**: Resend (API key configured)

- **Production** (`warrant.ink`): Trigger via "Publish" GitHub Action (`workflow_dispatch`)
- **Staging** (`dev.warrant.ink`): Auto-deploys on push to `main`

Environment variables are configured in Vercel project settings, scoped to Production vs Preview.

## Testing

```bash
npm run test          # Run all 142 unit tests
npm run test:e2e      # Run 32 Playwright E2E tests
npx vitest --ui       # Interactive test UI
```

Test coverage includes:
- **API routes**: auth/login, subscribe, bookmarks, flags, corrections, uploads
- **Services**: integrity scoring, distribution ranking, revenue calculation
- **Utilities**: API helpers, auth functions, Zod validations
- **Middleware**: route protection, security headers
- **E2E flows**: public pages, subscribe/checkout, journalist editor, admin moderation, access control, media rendering, read tracking

## Seed Data

The seed script creates realistic demo data:
- **3 journalist profiles** with varied reputation scores (68.5 → 82.5)
- **4 articles** (3 published, 1 draft) covering infrastructure corruption, data privacy, healthcare billing
- **Integrity events**: flags, corrections, integrity labels (SUPPORTED, DISPUTED, NEEDS_SOURCE)
- **Source citations**: FOIA requests, public records, satellite data, expert interviews
- **Demo accounts**: admin, journalist, reader, subscriber
- **Feature requests** with votes

## Documentation

| # | Document | Description |
|---|----------|-------------|
| 01 | [Platform Axioms](docs/01_platform_axioms.md) | Core principles guiding all decisions |
| 02 | [Product Requirements](docs/02_product_requirements.md) | MVP scope and product spec |
| 03 | [Legal Framework](docs/03_legal_framework.md) | Section 230, liability, language rules |
| 04 | [Integrity Model](docs/04_integrity_model.md) | How enforcement actually works |
| 05 | [Outreach Plan](docs/05_outreach_plan.md) | Stakeholder outreach and validation |
| 06 | [Open Questions](docs/06_open_questions.md) | Unresolved decisions |
| 07 | [Potential Ideas](docs/07_potential_ideas.md) | Features under consideration |
| -- | [Roadmap](docs/ROADMAP.md) | Status, blockers, and next steps |
| -- | [E2E Runbook](docs/AGENT_BROWSER_E2E_RUNBOOK.md) | Browser test flows for validation |

## License

[AGPL-3.0](LICENSE) — Warrant is open source. If you modify and deploy it, you must share your changes.
