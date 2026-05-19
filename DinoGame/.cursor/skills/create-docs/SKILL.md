---
name: create-docs
description: >-
  Documents project functionality and implementation decisions in README and
  docs/. Captures what the product does, how it works, controls, and why choices
  were made. Use when the user asks to document a project, write or update README,
  record decisions, explain what was built, or after implementing a feature that
  needs a durable explanation for future readers.
---

# Create Docs

Turn conversation context and code into **clear, durable documentation** so someone opening the repo later understands what the project is and how it behaves—without reading the whole codebase.

## When to apply

- User asks to document the project, update README, or "write down what we decided"
- A feature or app is implemented and needs a human-readable overview
- Requirements or tradeoffs were discussed in chat and should be preserved in files

**Do not** create new markdown files the user did not ask for. Prefer updating existing docs (`README.md`, `docs/`) unless they want a new file.

## Workflow

1. **Gather sources** (read before writing):
   - User messages: requirements, clarifications, rejected options
   - Implementation: entry points, config, tests, key modules
   - Existing docs: extend rather than duplicate

2. **Decide scope**:
   | Audience need | Primary file |
   | --- | --- |
   | What is this? How do I use it? | `README.md` |
   | How is it structured? Where to extend? | `docs/architecture.md` (or similar) |
   | Conventions / style | `docs/styleguide.md` |
   | One-off decision with alternatives | `docs/decisions/` ADR (only if warranted) |

3. **Write for a new teammate**, not for the agent:
   - Plain language, complete sentences
   - Tables for controls, mechanics, or config
   - Concrete values from code (speeds, limits, key bindings)—verify in source, do not guess

4. **Separate "what" from "how to run"**:
   - README leads with purpose and behavior, then controls, then run/test commands
   - Keep install commands accurate to the repo (`package.json`, scripts)

5. **Record decisions briefly** where they matter:
   - Format: **Decision** → **Why** (one line each)
   - Example: "Canvas over DOM — smoother animation and simpler collision"
   - Omit obvious choices; document non-default or user-specified tradeoffs

6. **Sync with code**: after doc edits, spot-check that behavior described still matches implementation.

## README structure (default template)

Use sections that fit the project; omit empty ones.

```markdown
# [Project name]

[One paragraph: what it is, stack, and hook.]

## What you do
[User-facing goals and core loop.]

## Controls / Usage
[Table of inputs or API entry points.]

## [Domain sections]
[e.g. Game flow, Obstacles, API endpoints, Config — project-specific.]

## Technical overview
[High-level architecture, key modules, non-obvious behavior. Link to docs/.]

## Run it
[Minimal steps; prefer copy-paste commands.]

## Run tests
[If applicable.]

## Repository layout
[Table: path → purpose.]
```

## Quality checklist

Before finishing, confirm:

- [ ] A reader learns **what** the project is without opening source
- [ ] Behavior described matches current code (numbers, keys, flows)
- [ ] User-stated requirements from the conversation appear (or are explicitly out of scope)
- [ ] No stale references to removed files or old demo content
- [ ] Links use repo-relative paths (`docs/architecture.md`)
- [ ] Proportional length—simple tools get short READMEs; complex apps get more sections

## Anti-patterns

- README that is only install instructions with no product description
- Duplicating full architecture in README when `docs/architecture.md` exists—summarize and link
- Documenting every file in the repo; document **roles**, not inventories
- Paraphrasing user requirements incorrectly—prefer their terms for features they named

## Additional resources

- Section examples and ADR snippet: [templates.md](templates.md)
