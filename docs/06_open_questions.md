# Open Questions

*Things to resolve before, during, or shortly after building.*

> **Updated Feb 2026:** Questions marked **RESOLVED** have been answered by the v1 implementation. Remaining questions are still open for future phases or business decisions.

---

## Product & Scope

### What qualifies as "first-hand" enough for revenue eligibility?

- Direct witness/participant?
- Original documents obtained?
- Exclusive interviews?
- Analysis of public records?

**Why it matters:** This defines who gets paid and sets expectations for contributors.

---

### What's the minimum viable integrity gating that doesn't kill supply?

Too strict → no one publishes
Too loose → platform has no differentiation

**Trade-off:** Speed to publish vs. quality signal

---

### What does this replace, day one?

Journalists won't adopt if it's "one more place to post." It needs to solve immediate pain:
- Monetization (better than Substack?)
- Distribution (better than Twitter?)
- Credibility (better than personal brand?)

---

## Integrity & Enforcement

### ~~How do we define "supported" vs "disputed" vs "validated"?~~ RESOLVED

Implemented as integrity labels: `SUPPORTED`, `DISPUTED`, `INSUFFICIENT_SOURCING`, `RETRACTED`. Avoided "validated" — uses process language per axioms. See `src/services/integrity.ts`.

---

### What exactly gets penalized?

- Behavior (process violations)?
- Outcomes (claims proven false)?
- Intent (knowingly false)?

**Why it matters:** Outcome-based penalties punish honest mistakes. Intent-based penalties are hard to prove. Process-based penalties may feel arbitrary.

---

### How do validators appeal penalties?

If "verification is publication" and validators inherit liability:
- What's the appeals process?
- What evidence overturns a penalty?
- How long does it take?

---

## Revenue & Economics

### ~~How should revenue weighting trade off between readership, integrity, and importance?~~ RESOLVED

Implemented as a composite of readership (article reads) + integrity track record (reputation score) + Gini coefficient correction (prevents winner-take-all). Topic importance not weighted — deferred. See `src/services/revenue.ts`.

---

### ~~What's the platform margin?~~ RESOLVED

Configurable via `PLATFORM_MARGIN` environment variable (default 15%). Transparent — shown in revenue calculations. See `src/services/revenue.ts`.

---

### ~~How do we prevent winner-take-all dynamics?~~ RESOLVED

Revenue engine includes Gini coefficient calculation and correction factor. Prevents any single journalist from capturing a disproportionate share. See `src/services/revenue.ts`.

---

## Identity & Anonymity

### Who holds the keys to journalist identity?

- Platform only?
- Third-party escrow?
- Journalist self-custody?

**Risk:** Single point of failure for reporter safety.

---

### What happens under subpoena?

- US government request
- Foreign government request
- Civil discovery in defamation suit

Need pre-planned response protocols.

---

### Can the identity system degrade safely?

If compromised:
- Can journalists revoke/rotate identities?
- Can they continue publishing?
- What's the blast radius?

---

## Governance & Capture

### Who is empowered to say "no"?

When money, growth, or governments push for rule changes:
- Who has veto power?
- What's the governance structure?
- How do you prevent gradual capture?

---

### How do we prevent the platform from becoming a battlefield?

Controversial topics will attract:
- Brigading
- Coordinated flagging
- Bad-faith disputes

**Mitigations needed:**
- Sampling-based reviews
- Coordination detection
- Topic-specific policies?

---

### What's the escalation policy for "serious allegation" content?

- Named individual + criminal accusation
- National security implications
- Active legal proceedings

Who adjudicates? What's the timeline? What's the standard?

---

## Technical

### ~~Build vs. buy for identity verification?~~ RESOLVED

Buy: Stripe Identity (document + selfie verification). Integrated with existing Stripe billing stack. Webhook handlers built for `identity.verification_session.verified` and `identity.verification_session.requires_input`. See `src/lib/stripe.ts` and `/api/profile/verify`.

---

### ~~How do we version and audit everything?~~ RESOLVED

Prisma schema includes `ArticleVersion` model for content versioning, `IntegrityEvent` for integrity changes, and `AuditLog` for sensitive actions. All timestamped and attributed. See `prisma/schema.prisma` and `src/lib/audit.ts`.

---

### How do we handle content takedowns?

When content is removed:
- Is it truly deleted?
- Archived for legal?
- Visible to author but not public?

---

## Legal

### Do we need liability insurance before launch?

**Probably yes.** Media liability insurance covers defense costs even if we're not liable.

---

### What's our response to a defamation lawsuit?

Even frivolous suits are expensive. Need:
- Rapid response protocol
- Pre-identified counsel
- Decision tree for settlement vs. defense

---

### What's our GDPR / international data story?

If journalists or readers are in EU:
- Data residency requirements
- Right to deletion vs. audit trail
- Consent flows

---

## Strategic

### What if a well-funded competitor copies this?

- Is the model defensible?
- Is it network-effects driven?
- What's the moat?

---

### What if no one comes?

Cold start problem:
- How do we get first 10 journalists?
- First 100 subscribers?
- First credibility-defining story?

---

### What if we succeed and then get acquired?

- How do we prevent mission drift?
- Should there be structural protections (nonprofit, benefit corp, etc.)?
- What's the endgame?

---

## Priority Matrix

| Question | Urgency | Status |
|----------|---------|--------|
| What qualifies as "first-hand"? | High | Open — policy decision needed before real journalists onboard |
| Identity key custody | High | Partially resolved — Stripe holds verification data; subpoena response protocol still needed |
| Revenue split model | Medium | Resolved — implemented with Gini correction |
| GDPR compliance | Medium | Open — depends on launch market |
| Governance structure | Low | Open — can evolve |
| Acquisition protections | Low | Open |

---

## Next Steps

1. Use outreach conversations to stress-test remaining open assumptions
2. Define "first-hand" content policy before journalist onboarding
3. Establish subpoena response protocol
4. Revisit quarterly as product evolves
