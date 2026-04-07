---
name: specify-feature
description: Builds feature specifications and planning documents from codebase research and targeted clarification, without implementing code. Use when the user wants a spec, design doc, or plan-only artifact; asks to document a feature before building it; wants docs/plans or ADR prep; or says not to implement yet.
---

# Specify Feature (plan-only)

Produce a **clear, actionable specification** the team can review before any code changes. Default outcome: a markdown file under `docs/plans/` (or the user’s chosen path). **Do not implement** the feature unless the user explicitly asks.

## When this applies

- User wants a **specification**, **design**, or **plan** without shipping code.
- User says **plan only**, **don’t implement**, **document first**, or similar.
- Preparing material for a later **ADR** or implementation ticket.

## Workflow

### 1. Research the codebase

- Map **where behavior lives** today (e.g. `js/stations/`, `js/core/state.js`, `js/core/simulation.js`, `index.html`, `css/main.css`).
- Find **existing patterns** to reuse (events, singletons, NPC vs player logic, UI tabs).
- Note **gaps** between desired behavior and current behavior.

Use search, targeted file reads, and short explore tasks. Prefer **evidence-backed** statements (file paths, function names) over assumptions.

### 2. Narrow decisions with questions

When multiple valid designs exist and the choice **materially changes** the spec:

- Ask **one or two** critical questions at a time (not a long questionnaire).
- Offer **concrete options** (e.g. scope A vs B, behavior X vs Y).

If the user already locked decisions, skip redundant questions.

### 3. Write the planning document

Create or update **`docs/plans/<short-kebab-title>.md`** (or path the user gave).

**Include:**

| Section | Purpose |
|--------|---------|
| Title + **planning only** | States this is not implemented; optional pointer to future ADR path. |
| **What we’re building** | User-visible behavior and goals (feature-agnostic pattern: outcomes, not ticket IDs). |
| **Key context from the codebase** | Bullet list with **relative links** to real files and a one-line role each. |
| **Decision / specification** | Rules, modes, state, events, UI touchpoints, edge cases. Use subsections if large. |
| **Consequences** | **Positive**, **Negative**, **Mitigations** (same shape as ADRs). |
| **Design notes / future work** | Optional split: “out of scope for v1”, “could be a follow-up ADR”. |
| **Follow-up work** | Checklist: formal ADR file, `docs/adrs/README.md` index row, implementation files—**for later**, not done in this pass unless requested. |

**Tone:** Precise enough to implement later; avoid placeholder TODOs in the spec body unless explicitly marked as open questions.

### 4. Boundaries

- **Do:** Research, clarify, write the plan doc, link to ADR template in [`docs/adrs/README.md`](../../../docs/adrs/README.md) when promotion to ADR is intended.
- **Do not:** Change application code, add tests, or register a new ADR in the index **unless** the user asks.

If the user later says “implement” or “write the ADR,” treat that as a **separate** task.

## Alignment with project docs

- **ADR shape** (Context, Decision, Consequences): mirror this in the plan so promotion to `docs/adrs/00XX-short-title.md` is mostly copy-edit + status.
- **Next ADR number:** Take from the index in [`docs/adrs/README.md`](../../../docs/adrs/README.md); do not guess if avoidable.

## Anti-patterns

- Specifying without **reading** the code that will change.
- **Implementing** while the user asked for a plan only.
- **Over-scoping** the first doc—capture “v1” clearly and park the rest under follow-up.
- Vague file references—use **repo-relative paths** (`js/core/foo.js`).

## Quick checklist

- [ ] Codebase facts verified (paths, existing behavior).
- [ ] Critical ambiguities resolved or explicitly listed as open.
- [ ] Plan file written under `docs/plans/` (or agreed location).
- [ ] Consequences and follow-up work recorded.
- [ ] No unsolicited implementation.
