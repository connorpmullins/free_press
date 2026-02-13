# Free Press

**Integrity-enforced investigative journalism platform.**

A subscription-based platform where independent journalists publish first-hand investigative reporting. Revenue flows to journalists, not the platform. Integrity is enforced through reputation, not editorial control.

> **Live:** [freepress-snowy.vercel.app](https://freepress-snowy.vercel.app)

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
- **Testing**: Vitest + Testing Library (136 tests)
- **Validation**: Zod v4

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local services)
- A Stripe account (for payment features)

### 1. Clone and install

```bash
git clone https://github.com/connorpmullins/free_press.git
cd free_press
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
│   │   ├── subscribe/     # Stripe checkout
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
└── middleware.ts           # Security headers + route protection
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run tests (Vitest, 136 tests) |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database and re-seed |
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
4. **Set up a webhook endpoint** pointing to `https://your-domain/api/webhooks/stripe` with events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `identity.verification_session.verified` (optional)
   - `identity.verification_session.requires_input` (optional)
5. **Update `.env`** with your keys, price IDs, and webhook secret

## Deployment

The app is deployed on [Vercel](https://vercel.com) with:
- **Database**: Neon Postgres (connected via Vercel Marketplace)
- **Payments**: Stripe (test mode, webhook configured)
- **Email**: Resend (API key configured)

Push to `main` to trigger a production deployment, or use:

```bash
npx vercel deploy --prod
```

For environment variables, configure them in the Vercel project settings or via CLI:
```bash
npx vercel env add VARIABLE_NAME production
```

## Testing

```bash
npm run test          # Run all 136 tests
npx vitest --ui       # Interactive test UI
```

Test coverage includes:
- **API routes**: auth/login, bookmarks, flags, corrections
- **Services**: integrity scoring, distribution ranking, revenue calculation
- **Utilities**: API helpers, auth functions, Zod validations
- **Middleware**: route protection, security headers

## Seed Data

The seed script creates realistic demo data:
- **3 journalist profiles** with varied reputation scores (68.5 → 82.5)
- **4 articles** (3 published, 1 draft) covering infrastructure corruption, data privacy, healthcare billing
- **Integrity events**: flags, corrections, integrity labels (SUPPORTED, DISPUTED, NEEDS_SOURCE)
- **Source citations**: FOIA requests, public records, satellite data, expert interviews
- **Demo accounts**: admin, journalist, reader, subscriber
- **Feature requests** with votes

## License

[AGPL-3.0](LICENSE) — Free Press is open source. If you modify and deploy it, you must share your changes.
