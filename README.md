# Free Press

**Integrity-enforced investigative journalism platform.**

A subscription-based platform where independent journalists publish first-hand investigative reporting. Revenue flows to journalists, not the platform. Integrity is enforced through reputation, not editorial control.

## Principles

- **Truth is a process, not a badge** — We use "supported," "disputed," and "insufficient sourcing" — never "verified true."
- **Verification is publication** — Any account that publicly validates a claim assumes the same responsibility as if it had published the claim itself.
- **Identity where it matters** — Readers can be pseudonymous. Revenue-earning contributors must be verified humans.
- **Incentives over intentions** — Revenue, distribution, and reputation are tied to demonstrated integrity.
- **Everything is auditable** — Every claim, edit, and action is attributable, versioned, and reversible.

## Tech Stack

- **Framework**: Next.js 16 (Turbopack)
- **Database**: PostgreSQL + Prisma 7
- **Cache/Rate Limiting**: Redis (ioredis)
- **Search**: Meilisearch
- **Payments**: Stripe (subscriptions, Connect, Identity)
- **Email**: Resend / Nodemailer (configurable)
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **Testing**: Vitest + Testing Library
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

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run tests (Vitest) |
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
- Session-based auth with secure cookies
- Rate limiting on all API endpoints
- XSS protection via `sanitize-html`
- CSRF protection via SameSite cookies
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Role-based route protection via middleware

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
   - `identity.verification_session.verified` (optional, for journalist identity verification)
   - `identity.verification_session.requires_input` (optional)
5. **Update `.env`** with your keys, price IDs, and webhook secret

## Deployment

The app is deployed on [Vercel](https://vercel.com). Push to `main` to trigger a production deployment.

For environment variables, configure them in the Vercel project settings dashboard.

## Testing

```bash
npm run test          # Run all tests
npx vitest run --ui   # Interactive test UI
```

136 tests covering:
- API routes (auth, bookmarks, flags, corrections)
- Services (integrity, distribution, revenue)
- Utility libraries (api, auth, validations)
- Middleware (route protection, security headers)

## License

[AGPL-3.0](LICENSE) — Free Press is open source. If you modify and deploy it, you must share your changes.
