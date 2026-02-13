# Contributing to Free Press

Thank you for your interest in contributing to Free Press. This document outlines our development workflow and standards.

## Development Setup

1. **Fork & clone** the repository
2. **Install dependencies**: `npm install`
3. **Start local services**: `docker compose up -d` (PostgreSQL, Redis, Meilisearch, Mailpit)
4. **Set up environment**: `cp .env.example .env` and fill in values
5. **Push database schema**: `npm run db:push`
6. **Seed data**: `npm run db:seed`
7. **Start dev server**: `npm run dev`

## Project Structure

```
src/
├── app/                 # Next.js App Router pages and API routes
│   ├── api/             # REST API endpoints
│   ├── admin/           # Admin dashboard pages
│   ├── journalist/      # Journalist dashboard pages
│   └── ...              # Public-facing pages
├── components/          # React components
│   ├── ui/              # shadcn/ui primitives
│   ├── layout/          # Header, footer, nav
│   ├── article/         # Article-related components
│   └── editor/          # Rich text editor
├── lib/                 # Shared utilities
│   ├── auth.ts          # Authentication (magic links, sessions)
│   ├── db.ts            # Prisma client
│   ├── validations.ts   # Zod schemas
│   ├── stripe.ts        # Payment integration
│   ├── email.ts         # Email sending
│   ├── redis.ts         # Cache and rate limiting
│   └── search.ts        # Meilisearch client
├── services/            # Business logic
│   ├── integrity.ts     # Reputation scoring
│   ├── distribution.ts  # Article ranking
│   └── revenue.ts       # Revenue distribution
└── test/                # Test setup and utilities
```

## Code Standards

### TypeScript

- Strict mode is enabled. All code must pass type checks.
- Use Zod schemas for runtime validation of all API inputs.
- Prefer explicit types over `any` — use `any` only when interfacing with Prisma transaction callbacks or other third-party type limitations, and add a comment explaining why.

### API Routes

- All API routes use `successResponse()` and `errorResponse()` from `src/lib/api.ts`.
- Wrap all route handlers in try/catch and use `handleApiError()` for consistent error responses.
- Require authentication via `requireAuth()` for protected endpoints.
- Rate limit sensitive endpoints using `checkRateLimit()` from `src/lib/redis.ts`.

### Testing

- Write tests for all new services, utility functions, and API routes.
- Tests go alongside the code they test (e.g., `auth.ts` → `auth.test.ts`).
- Run `npm test` before submitting a PR.
- Mock external dependencies (database, Redis, Stripe, email) — never hit real services in tests.

### Security

- Never trust user input. Validate with Zod, sanitize HTML output with `sanitize-html`.
- All user-facing content rendering must go through XSS sanitization.
- Audit sensitive actions using `auditLog()` from `src/lib/audit.ts`.
- Never expose internal error messages in production API responses.

## Making Changes

1. **Create a branch** from `main` with a descriptive name (e.g., `fix/reputation-overflow`, `feature/comment-system`)
2. **Make your changes** following the standards above
3. **Write/update tests** for any changed behavior
4. **Run the test suite**: `npm test`
5. **Ensure the build passes**: `npm run build`
6. **Submit a pull request** with a clear description of what changed and why

## Commit Messages

Use clear, imperative-mood commit messages:

- `Add rate limiting to correction API`
- `Fix reputation score overflow when penalty exceeds 100`
- `Update distribution scoring weights`

## Integrity Model

If your contribution touches the integrity system (reputation, labels, distribution, corrections, flags), please be especially careful:

- The integrity model is the core of the platform. Changes affect journalist livelihoods.
- Review `docs/04_integrity_model.md` before making changes.
- Add tests that cover edge cases (zero scores, maximum penalties, boundary conditions).
- Document your reasoning in the PR description.

## Questions?

Open an issue or reach out to the maintainers. We value thoughtful contributions over fast ones.
