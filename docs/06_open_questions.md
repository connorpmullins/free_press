# Open Questions

*Things to resolve before, during, or shortly after building.*

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

### How do we define "supported" vs "disputed" vs "validated"?

These labels need to be:
- Legible to readers
- Defensible legally
- Operational for the system

**Risk:** Labels that sound like truth claims ("validated") invite liability.

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

### How should revenue weighting trade off between:

- Readership (engagement)
- Integrity track record
- Topic importance / public benefit

Pure readership → engagement incentives return
Pure integrity → low readership content dominates
Pure importance → who decides what's important?

---

### What's the platform margin?

- 10%? 20%? 30%?
- Fixed or variable?
- Transparent to contributors?

**Principle:** Capped and transparent, covering infra + verification + integrity ops.

---

### How do we prevent winner-take-all dynamics?

If a few journalists capture most revenue:
- Is that a problem?
- How do we measure (Gini coefficient)?
- What interventions are appropriate?

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

### Build vs. buy for identity verification?

**Recommendation:** Buy (Jumio)

But need to understand:
- Data retention policies
- Jurisdiction of data storage
- Failure modes

---

### How do we version and audit everything?

Every claim, edit, validation, and action needs:
- Timestamp
- Attribution
- Immutable record

What's the data architecture?

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

| Question | Urgency | Blocking? |
|----------|---------|-----------|
| What qualifies as "first-hand"? | High | Yes (defines MVP) |
| Identity key custody | High | Yes (architecture) |
| Revenue split model | Medium | No (can iterate) |
| GDPR compliance | Medium | Depends on launch market |
| Governance structure | Low | No (can evolve) |
| Acquisition protections | Low | No |

---

## Next Steps

1. Resolve blocking questions before architecture
2. Use outreach conversations to stress-test assumptions
3. Document decisions in a decision log
4. Revisit quarterly as product evolves
