# Product Requirements Document (PRD)

**Project:** Integrity-Enforced Investigative Journalism Platform  
**Status:** Draft v0.1  
**Last Updated:** 2026-01-21

---

## 1. Summary

Build a paid subscription platform (web + mobile) that:

- Hosts independent journalists' first-hand reporting
- Enforces journalistic integrity via process gating, reputation, and distribution controls
- Routes most subscription revenue to verified journalists
- Uses a lightweight "wisdom of crowds" mechanism for product evolution (advisory, not editorial)

**Key constraint:** Platform posture only. We do not publish our own content.

---

## 2. Problem Statement

### Reader Problem

Readers who will pay for news want:
- High-signal investigative reporting
- Clear provenance and sourcing
- Confidence that falsehoods are punished and corrected
- Understanding of "what we know" vs "what's disputed"

### Journalist Problem

Independent journalists want:
- A credible distribution channel
- Fair monetization without ad incentives
- Protection against engagement gaming
- Tools that make sourcing and credibility legible to readers

### Ecosystem Problem

Digital media incentives reward:
- Speed over verification
- Outrage/engagement over truth
- Low accountability for repeat inaccuracies

**This product shifts incentives** by coupling distribution privilege, economic reward, and reputation to demonstrated integrity.

---

## 3. Goals

1. Enable subscription-paid consumption and sharing of high-quality investigative work (web + iOS/Android)
2. Route most subscription revenue to verified journalists publishing first-hand reporting
3. Enforce integrity through:
   - Clear sourcing requirements
   - Corrections workflow
   - Reputation-weighted distribution
   - Penalties for repeated unsupported claims
4. Provide lightweight product feedback/voting space (advisory only)

---

## 4. Non-Goals (v1)

- ❌ We are not an editorial newsroom commissioning investigations
- ❌ We are not guaranteeing factual truth of all content
- ❌ We are not doing real-time breaking-news feed optimization
- ❌ We are not implementing binding governance over editorial policy
- ❌ We are not allowing anonymous, unverified users to publish first-hand allegations
- ❌ We are not building the knowledge graph / wiki layer (deferred to v2)

---

## 5. Personas

### Reader / Subscriber
- Pays monthly/annual
- Reads, saves, shares
- Can flag issues, suggest corrections, vote on product features

### Verified Journalist (First-hand Contributor)
- Verified human identity (government ID + liveness)
- Publishes first-hand reporting under author profile
- Earns revenue share
- Subject to integrity scoring and penalties

### Platform Integrity Ops (Internal)
- Handles escalations: defamation-risk flags, abuse, repeated policy violations

---

## 6. Product Surface Area

### A. Journalism Marketplace (Core)

**Reader-facing:**
- Feed / homepage (personalized + editorial-neutral ranking)
- Article page with:
  - Author identity badge ("Verified contributor")
  - Source list / citations
  - Integrity status (supported / disputed / needs source)
  - Correction history
- Author page: bio, beats, track record, reputation summary

**Journalist-facing:**
- Submission portal
- Source attachment UI (required fields)
- Analytics (views, reads, revenue, integrity flags)
- Corrections workflow

**Behind the scenes:**
- Distribution engine (reputation + integrity signals affect reach)
- Revenue share ledger (monthly payouts)
- Flagging + label system

### B. Product Feedback (Light)

- Feature request board
- Voting + comments (advisory)
- Decision logs ("Planned / Not planned / Shipped")

---

## 7. MVP Requirements (Phase 1)

### P0 (Must Have)

| Feature | Description |
|---------|-------------|
| Paid subscription | Monthly + annual plans, web + app |
| Journalist onboarding | Identity verification via SaaS (Jumio recommended) |
| Article submission | No substantive editing by platform |
| Source attachment | Required fields for citations |
| Distribution engine | Reputation-weighted ranking |
| Flagging + labels | "Disputed", "Needs Source", etc. |
| Corrections flow | Author-initiated + platform-initiated |
| Revenue ledger | Monthly payouts (can be manual initially) |

### P1 (Should Have)

| Feature | Description |
|---------|-------------|
| Author profiles | Integrity summaries, track record |
| Share links | Previews for non-subscribers |
| Bookmarking | Reader saves + notifications |
| Journalist analytics | Views, reads, revenue, flags |

---

## 8. Success Metrics

### Marketplace Health
- Subscriber conversion rate, churn, retention
- % of subscription revenue paid to journalists
- Revenue concentration (Gini coefficient—avoid winner-take-all)
- Publish cadence

### Integrity
- % of articles with complete sourcing
- Correction rate and severity
- Dispute resolution time
- Repeat offender rate
- Reader trust proxy (% marking content "well sourced")

---

## 9. Technical Architecture (High-Level)

### Suggested Stack
- **Web:** Next.js / React
- **Mobile:** React Native (or Flutter)
- **Backend:** API service + content store
- **Payments:** Stripe (subscriptions + payouts)
- **Identity verification:** Jumio (200+ countries, strongest anti-fraud)
- **Search:** Meilisearch or Elasticsearch

### Core Services
- Identity & roles
- Content ingestion + storage
- Integrity signals engine
- Ranking/distribution
- Revenue accounting + payouts
- Moderation & dispute queue

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Becoming a "publisher" by behavior | Strict "no substantive edits" policy; clear platform labels |
| Reputation system gamed | Weight by verified identity + tenure; detect coordination |
| Journalists don't adopt | Solve real pain (monetization, distribution) on day one |
| Legal exposure | Liability insurance; rapid takedown process; pre-pub gating for high-risk claims |

---

## 11. Open Questions

See `06_open_questions.md` for full list.

---

## Appendix: Deferred Features (v2+)

- Knowledge graph / wiki layer (topic pages, claim extraction)
- Reviewer/validator role
- Community participation in edits
- Trusted reviewer program
