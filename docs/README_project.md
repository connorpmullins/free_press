# Free Press

*An integrity-enforced investigative journalism platform.*

---

## What Is This?

A subscription-based platform where:

- Independent journalists publish first-hand investigative reporting
- Revenue flows to journalists, not the platform
- Integrity is enforced through reputation, not editorial control
- Readers get high-signal journalism with clear provenance

**We are a platform, not a publisher.** We don't write or edit content. We enforce standards through economic incentives and process transparency.

---

## Core Idea

> Any account that publicly validates a claim assumes the same responsibility and consequences as if it had published the claim itself.

This closes the "liability gap" in most media systems, where original posters bear risk but amplifiers and fact-checkers do not.

---

## Status

🟢 **Core MVP Built & Deployed** — [freepress-snowy.vercel.app](https://freepress-snowy.vercel.app)

### What's Live
- Full-stack Next.js 16 app with Prisma 7 + Neon Postgres
- Magic link authentication with session management
- Article system with versioning, sources, integrity labels
- Stripe subscription integration ($5/mo, $50/yr)
- Reputation scoring, distribution engine, corrections pipeline
- Admin moderation tools (flags, disputes)
- Feedback/voting system, search UI, bookmarks
- 136 passing unit tests
- Docker Compose for local development

### Remaining Work
See [next_steps.md](../next_steps.md) for the detailed roadmap.

---

## Foundational Documents

| # | Document | Description |
|---|----------|-------------|
| 01 | [Platform Axioms](./01_platform_axioms.md) | Core principles guiding all decisions |
| 02 | [Product Requirements](./02_product_requirements.md) | What we're building (MVP scope) |
| 03 | [Legal Framework](./03_legal_framework.md) | Section 230, liability, language rules |
| 04 | [Integrity Model](./04_integrity_model.md) | How enforcement actually works |
| 05 | [Outreach Plan](./05_outreach_plan.md) | Who to talk to and what to learn |
| 06 | [Open Questions](./06_open_questions.md) | Things to resolve |
| 07 | [Potential Ideas](./07_potential_ideas.md) | Features under consideration |

**Source material:** [ChatGPT Conversation Export](./chatgpt_conversation_news_platform.md)

---

## Key Principles

1. **Platform, not publisher** — We host, we don't edit
2. **Truth is a process** — "Supported/disputed/insufficient," never "true/false"
3. **Verification is publication** — Validators inherit author liability
4. **Identity where it matters** — Verified humans, pseudonymous bylines
5. **Incentives over intentions** — Design for alignment, not good faith

---

## MVP Scope (Phase 1) — ✅ Complete

- Paid subscription (web)
- Journalist identity verification (Stripe Identity — webhook handlers built)
- Article submission with required sourcing
- Reputation-weighted distribution
- Flagging, labels, corrections
- Revenue sharing calculation engine

**Deferred to v2+:** Knowledge graph, wiki layer, community validation, mobile app

---

## Contact

*[Your contact info here]*
