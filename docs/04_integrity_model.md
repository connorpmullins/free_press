# Integrity Model

*How the platform enforces journalistic standards without becoming a publisher.*

---

## 1. Core Principle

We enforce integrity through **signals and consequences**, not editorial judgment.

The platform never decides what's true. It tracks:

- Whether claims have adequate sourcing
- Whether claims have been disputed
- Whether corrections have been issued
- The track record of the author

---

## 2. Integrity Signals (Inputs)

These are the raw signals the system collects:

### Source-Level Signals

| Signal | Description |
|--------|-------------|
| Source completeness | Are links/docs attached? Is claim attribution clear? |
| Source quality | Primary vs secondary sources; official vs anonymous |
| Claim specificity | Does it include who/what/when/where? |

### Outcome Signals

| Signal | Description |
|--------|-------------|
| Dispute rate | How often are this author's claims disputed? |
| Dispute outcomes | When disputed, how often is the author upheld vs overturned? |
| Correction frequency | How often does author issue corrections? |
| Correction severity | Typos vs material factual errors |

### Community Signals

| Signal | Description |
|--------|-------------|
| Flags | Weighted by rater reputation |
| Validations | Other verified accounts endorsing claims |
| Citations | How often is this work cited by others? |

---

## 3. Integrity Actions (Outputs)

Based on signals, the platform takes graduated actions:

### Content-Level Actions

| Action | When Applied |
|--------|--------------|
| **Full distribution** | High-integrity content, complete sourcing |
| **Reduced distribution** | Low source completeness, new author |
| **Label: "Needs Source"** | Factual claims without citations |
| **Label: "Disputed"** | Credible counter-evidence submitted |
| **Label: "Correction Issued"** | Author has amended claims |
| **Held for review** | High-risk content (named individual + allegation) |
| **Removed** | Policy violation, legal risk, refusal to correct |

### Account-Level Actions

| Action | When Applied |
|--------|--------------|
| **Full privileges** | Good standing |
| **Throttled** | Recent integrity issues; reduced distribution until resolved |
| **Revenue suspended** | Pending investigation |
| **Cooldown** | Temporary publishing restriction |
| **Banned** | Repeated violations, fabrication |

---

## 4. The "Verification Is Publication" Principle

This is a key differentiator from other platforms.

### The Problem It Solves

Most systems create a **liability gap**:

- Original poster bears risk
- Validators, fact-checkers, and amplifiers bear far less

This produces:

- Low-reputation actors posting risky claims
- High-reputation actors "verifying" them cheaply
- Epistemic risk externalized upward

### Our Rule

> Any account that publicly validates a claim assumes the same responsibility and consequences as if it had published the claim itself.

- Posting false information → penalty
- **Validating false information → identical penalty**

### What This Changes

1. **Endorsement becomes scarce** — You only validate what you're willing to stake reputation on
2. **Fact-checking becomes adversarial** — Copy-paste validation is irrational
3. **Reputation graphs get teeth** — False claims propagate backward through validators

---

## 5. Validation Categories

Not all endorsements are equal. Validators must choose scope:

| Validation Type | Meaning | Liability |
|-----------------|---------|-----------|
| **Full endorsement** | "I believe this is accurate" | Full |
| **Source authentic** | "The document/recording is real" | Partial |
| **Claim plausible** | "This is consistent with other evidence" | Partial |
| **Methodology sound** | "The investigation process was rigorous" | Partial |

Validators are punished for **overstating certainty**, not for cautious, scope-limited validation.

---

## 6. Temporal Considerations

### Good Faith Defense

Validators are NOT punished for:

- Good-faith validation
- Based on best-available evidence at the time
- Later overturned by new information

### Penalty Triggers

Penalties apply for:

- **Negligence** — ignoring known counter-evidence
- **Overstatement** — claiming certainty without basis
- **Competence violation** — validating outside expertise

This requires tracking **what was known when**.

---

## 7. Reputation Scoring

### How Reputation Accumulates

| Action | Effect |
|--------|--------|
| Publishing well-sourced content | +reputation |
| Content cited by others | +reputation |
| Corrections issued promptly | Neutral (shows integrity) |
| Upheld disputes against your content | -reputation |
| Validating content later proven false | -reputation |
| Tenure (time on platform) | +weight to signals |

### How Reputation Affects Distribution

- Higher reputation → broader initial distribution
- Lower reputation → slower distribution, more scrutiny
- Very low reputation → throttled or suspended

### Anti-Gaming Measures

- Weight signals by verified identity + tenure
- Detect coordinated voting/flagging
- Cap influence of new accounts
- Sampling-based reviews for controversial topics

---

## 8. The Reputation Graph

The system can be modeled as a graph:

```
Nodes: accounts
Edges: "validated X's claim Y"
Edge weight: confidence / scope / evidence strength
```

When a claim is proven false:

- Original author penalized
- All validators penalized (proportional to their endorsement scope)
- Penalty propagates **backward** through the validation chain

This discourages **credibility laundering** — the practice of using high-reputation accounts to legitimize questionable claims.

---

## 9. Escalation Paths

### Automatic Escalation Triggers

| Trigger | Action |
|---------|--------|
| Named individual + allegation + weak sourcing | Hold for review |
| Multiple flags from high-reputation accounts | Expedited review |
| Legal threat received | Immediate escalation to ops |
| Author disputes removal | Appeals process |

### Appeals Process

1. Author submits appeal with additional evidence
2. Review by integrity ops (not original reviewer)
3. Decision within 72 hours
4. Decision logged publicly (anonymized)

---

## 10. What We Don't Do

| Action | Why Not |
|--------|---------|
| Rewrite content | Crosses into co-authorship (legal risk) |
| Decide what's "true" | We track process, not truth |
| Editorialize in labels | Labels are factual ("disputed") not evaluative ("wrong") |
| Publish corrections ourselves | Author must issue corrections |

---

## 11. Summary

The integrity model works through:

1. **Signals** — Collecting data on sourcing, disputes, corrections
2. **Scores** — Computing reputation from track record
3. **Actions** — Adjusting distribution, adding labels, escalating
4. **Incentives** — Making integrity economically rational

The platform never says "this is true." It says "this has these properties" and lets readers and the system respond accordingly.
