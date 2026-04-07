---
name: check-documentation
description: Analyzes project documentation for completeness and conciseness and produces prioritized remediation recommendations. Use when the user asks to check docs, review documentation, analyze documentation, assess docs for completeness or conciseness, or improve documentation—either overall or for a specific area or topic.
---

# Check Documentation

Analyze project documentation for **completeness** and **conciseness**, then output actionable recommendations. Scope can be full doc set or a specific area/topic.

## Scope

- **Overall**: Discover all docs (README, ARCHITECTURE, CONTRIBUTING, style guides, ADRs, commands, etc.), then apply the checklists below.
- **Topic-specific**: Limit to docs for that topic (e.g. "testing", "API", "weapons system"). Discover only relevant files and sections, then apply the checklists.

When the user names a topic or area, restrict the analysis to that scope.

## Completeness checklist

Use this to find gaps and inaccuracies:

- **Coverage**: Are expected entry points documented? (e.g. README quick start, project structure, how to run tests, how to contribute.)
- **Project structure**: Does README or equivalent list main modules/dirs? Compare the described structure to the repo (e.g. `js/`, `docs/`, `tests/`); note missing or outdated entries.
- **Testing**: Is it documented where tests live and how to run them? Do commands or README reference the correct runner (e.g. Jest vs custom harness vs pytest)?
- **Accuracy / drift**: Do docs match the codebase? (Tech stack, file names, commands, config.) Check AGENTS.md or similar for stack mismatch with the actual project.
- **Source of truth**: For style/design docs, is it stated where canonical values live (e.g. "variables in `main.css`")?
- **Cross-references**: Do high-level docs link to detailed ones (e.g. ARCHITECTURE → ADRs)? Are "see also" links missing where content is duplicated?

Record: **Gap** (missing), **Inaccuracy** (wrong), or **OK**. Add one-line recommendation per finding.

## Conciseness checklist

Use this to find redundancy and verbosity:

- **Duplication**: Is the same decision or fact stated in multiple places? Prefer one canonical place (e.g. ADR) and "see ADR-XXX" elsewhere.
- **ARCHITECTURE vs ADRs**: If both exist, does ARCHITECTURE repeat ADR content? Recommend shortening and linking to ADRs.
- **Style/design docs vs code**: Are hex values or config repeated in docs instead of referencing the source file?
- **Verbosity**: Are there long implementation paragraphs in ADRs that could move to a linked "Implementation notes" section or file?
- **Single source of truth**: For each concept (e.g. "station interface"), is one doc the canonical definition and others referencing it?

Record: **Redundant**, **Too verbose**, or **OK**. Add one-line recommendation per finding.

## Output format

Produce a short report using this structure:

```markdown
# Documentation Analysis [and: / Topic Name]

## Scope
[List of docs/sections reviewed]

## Completeness
| Finding | Location | Recommendation |
|---------|----------|-----------------|
...

## Conciseness
| Finding | Location | Recommendation |
|---------|----------|-----------------|
...

## Prioritized remediation
- **High**: [Accuracy, discoverability, critical gaps]
- **Medium**: [Reduced duplication, clearer structure]
- **Lower**: [Optional improvements]

## Summary
[2–3 sentences]
```

Optionally add a **Recommendations** table with columns: Issue | Location | Recommendation, if that fits the findings better.

## Workflow

1. **Determine scope**: Overall or topic/area (from user request).
2. **Discover docs**: List `**/*.md` and any referenced doc locations; if topic-specific, restrict to relevant paths/sections.
3. **Read key docs**: README, ARCHITECTURE, ADR index, and any topic-specific files. Spot-check code vs docs (structure, commands, stack).
4. **Run completeness checklist** over the scope; note gaps and inaccuracies.
5. **Run conciseness checklist** over the scope; note redundancy and verbosity.
6. **Write report** using the output format above; prioritize so high = fix first.

## Optional: persist report

If the user wants the analysis saved, write it to a file (e.g. `docs/DOCUMENTATION-ANALYSIS-AND-RECOMMENDATIONS.md` or `docs/doc-review-<topic>.md`) and mention the path in the summary.
