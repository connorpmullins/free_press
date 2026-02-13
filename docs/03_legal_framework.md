# Legal & Liability Framework

*How we maintain platform status under Section 230 while enforcing high integrity standards.*

---

## 1. The Core Legal Question

> Can we aggressively vet, moderate, and enforce quality standards without becoming a "publisher" liable for user content?

**Answer: Yes**, if we're disciplined about boundaries.

---

## 2. Section 230 Basics

Section 230 of the Communications Decency Act provides:

1. An online service isn't treated as the "publisher or speaker" of information provided by someone else
2. Platforms are **explicitly protected** when they moderate content in good faith

This means we **can** do:
- Pre- or post-publication review
- Fact-checking
- Adding warnings/labels
- Ranking/downranking
- Removing posts / banning accounts

...and still retain platform protection.

---

## 3. Where Platforms Lose Protection

You lose Section 230 protection when you become an "information content provider"—i.e., you **materially contribute** to the unlawfulness of content.

### The Roommates.com Example

The site required users to provide discriminatory information and used it in matching. The court treated that as **developing** illegal content, not merely hosting it.

### What Triggers "Material Contribution"

| Action | Risk Level |
|--------|------------|
| Moderating, removing, downranking | ✅ Safe |
| Fact-check labels ("Disputed") | ✅ Safe |
| Adding context links | ✅ Safe |
| Algorithmic recommendations | ✅ Mostly safe |
| Co-writing or rewriting user posts | ⚠️ Risky |
| Forcing prompts that elicit unlawful content | ⚠️ Risky |
| Commissioning + editorial control | ⚠️ Risky |
| Claiming "everything here is verified true" | ⚠️ Risky |

---

## 4. Our Content Taxonomy: Three Lanes

Since we do not publish our own content, we operate in a simplified two-lane model:

### Lane 1: Verified Contributor Content

- First-hand reporting from identity-verified journalists
- **Platform posture:** We host, we don't edit
- **Allowed actions:** Label, downrank, remove, request resubmission
- **Forbidden:** Rewriting, "improving," or co-authoring

### Lane 2: Community Content

- Comments, tips, leads, discussions, feature requests
- **Platform posture:** Full Section 230 protection
- **Allowed actions:** Moderate, remove, downrank
- **Forbidden:** Same as above

### What We Don't Have (by design)

- ❌ Newsroom lane (staff-written investigations)
- ❌ Commissioned content

This simplifies our legal posture significantly.

---

## 5. Language Rules

To protect the platform model, we use specific language patterns.

### Never Say

- "We investigated..."
- "Our reporting proves..."
- "Verified true"
- "We confirmed..."

### Always Say

- "Author X reports..."
- "This claim is supported by..."
- "According to [source]..."

### Platform Labels (Approved)

- "Insufficient sourcing"
- "Disputed"
- "Correction issued"
- "Needs source"
- "Author verified" (for identity, not content truth)

---

## 6. High-Risk Content Handling

Certain content types require additional process:

### Automatic Escalation Triggers

- Named individual + allegation of wrongdoing
- Weak or absent sourcing
- Legal threat received
- Government/law enforcement inquiry

### Escalation Actions

1. Hold from distribution (don't publish until reviewed)
2. Internal legal review
3. Request additional sourcing from author
4. If unresolvable: reject or remove

---

## 7. Marketing & Public Claims

**Don't say:** "Everything on our platform is verified true"

**Do say:** "We use rigorous standards, publish corrections, and enforce credibility-based distribution"

The word "verified" should only apply to:
- Identity verification ("Verified contributor")
- Process completion ("Sources verified as attached")

Never to content truth claims.

---

## 8. Subpoena & Legal Pressure

### What We Store
- Verification outcome (pass/fail)
- Minimal PII necessary for verification
- Pseudonymous author profiles (public-facing)

### Architectural Principle
- Separate identity verification data from publishing activity
- Consider jurisdictional placement of sensitive data
- Document retention policies before launch

### Threat Scenarios
- US subpoena for journalist identity
- Foreign government request
- Civil discovery in defamation suit

Each requires pre-planned response protocols. See threat model (separate doc).

---

## 9. Insurance

Before launch, obtain:
- **Media liability insurance** (covers defamation claims)
- **D&O insurance** (directors and officers)
- **Cyber liability insurance** (data breach)

Even with platform posture, insurance provides defense cost coverage.

---

## 10. Summary

| Principle | Implementation |
|-----------|----------------|
| Platform, not publisher | No editing, no commissioning, no co-authoring |
| Process language | "Supported/disputed/insufficient" not "true/false" |
| Clear attribution | Author owns claims, platform owns labels |
| High-risk gating | Escalation triggers for sensitive content |
| Defensive marketing | Never claim omniscience |
