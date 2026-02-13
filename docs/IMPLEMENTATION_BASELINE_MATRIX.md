# Free Press Implementation Baseline Matrix

Date: 2026-02-13

Purpose: Snapshot of current implementation status before finish-line work.

Status legend:
- `done`: Implemented and appears functional
- `partial`: Implemented in part, missing major path(s)
- `missing`: Not implemented
- `broken`: Implemented but currently non-functional

## Product/Platform Matrix

| Area | Status | Notes |
|---|---|---|
| Magic-link auth flow | partial | Works in code, but real-user delivery depends on Resend custom domain setup |
| Session handling | partial | DB + Redis cache path exists; middleware page gate relies on cookie presence |
| Stripe subscription checkout | partial | Core flow exists; unsafe production fallback mock mode present if Stripe is disabled |
| Stripe Identity verification | partial | Stripe helper + webhook handling exists; no API/UI trigger flow for starting verification |
| Stripe Connect onboarding | missing | Low-level helpers exist; no API/UI orchestration for onboarding |
| Payout execution flow | missing | Transfer helper exists; no payout API/job/admin trigger path |
| Search API | partial | Search route exists; indexing on publish exists; lifecycle sync/backfill incomplete |
| Journalist editor/write flow | done | Rich Tiptap editor present and wired into write page |
| Legal pages linked in footer | missing | `/terms`, `/privacy`, `/transparency`, `/integrity` routes are absent |
| Revenue calculations | partial | Revenue engine exists; currently uses placeholder read proxy, no real read tracking |
| Admin moderation UI | partial | Core pages/routes exist, but needs usability and bulk-action polish |
| E2E automation | missing | Playwright dependency exists; config/spec scaffolding absent |

## Security Audit Mapping (`docs/SECURITY_AUDIT.md`)

| Finding | Original Severity | Mapping | Rationale |
|---|---|---|---|
| Subscription bypass when Stripe disabled (`/api/subscribe`) | High | confirmed | Current code activates subscriptions directly when Stripe client is unavailable |
| CSRF guard allows missing Origin (`middleware`) | Medium | confirmed | Middleware check allows mutation requests with no Origin/Referer |
| Login throttling only per-email (`/api/auth/login`) | Medium | confirmed | Email key limit exists, but no IP/global limiter |
| Protected pages rely on cookie presence (`middleware`) | Low | confirmed | Protected page routes check cookie presence, not verified session |
| CSP allows unsafe-inline + unsafe-eval globally (`middleware`) | Low | confirmed | Policy is permissive and should be tightened where possible |

## Execution Priorities

1. P0 infra prerequisites: Resend custom sender domain, Redis prod, Meilisearch prod.
2. Close verified security findings before release gates.
3. Complete missing Identity/Connect/payout flows.
4. Add legal pages and read-tracking-backed revenue signals.
5. Add Playwright scaffolding + flow tests, then run manual browser certification.
