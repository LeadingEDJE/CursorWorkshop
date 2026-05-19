# Create Docs — Templates

## Game / interactive app (example sections)

```markdown
## Game flow
1. **Start** — …
2. **Playing** — …
3. **Game over** — …

## Obstacles / challenges
| Type | … | Behavior |
| --- | --- | --- |

## Difficulty scaling
| Mechanic | Behavior |
| --- | --- |
```

## Decisions block (inline in README or architecture doc)

```markdown
## Design decisions

| Topic | Choice | Rationale |
| --- | --- | --- |
| Rendering | HTML5 Canvas | Smooth animation; AABB collision |
| Visual theme | Synthwave dark mode | User requirement; neon palette in CSS variables |
| Dependencies | Vanilla JS only | No bundler required to play |
```

## Minimal ADR (`docs/decisions/0001-short-title.md`)

```markdown
# 0001. [Title]

## Status
Accepted

## Context
[Problem or requirement.]

## Decision
[What we chose.]

## Consequences
[Positive and negative follow-ups.]
```

## Library / API project (example sections)

```markdown
## Installation
## Quick example
## API overview
| Export | Purpose |
| --- | --- |
## Configuration
| Option | Default | Description |
| --- | --- | --- |
```

## After documenting

Suggest to the user (only if relevant):

- Run tests to ensure examples/commands still work
- Commit doc changes with the feature if they use version control
