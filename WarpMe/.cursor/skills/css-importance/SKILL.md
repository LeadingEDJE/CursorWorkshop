---
name: css-importance
description: >-
  Enforces avoiding CSS !important in favor of specificity, cascade order, and
  structure. Use when writing or reviewing CSS/SCSS, fixing style conflicts,
  overriding third-party styles, debugging specificity wars, or when the user
  mentions !important, overrides, or cascade issues.
files: ["**/*.css", "**/*.scss"]
---

# Avoid `!important` in CSS

Do not add `!important` to declarations. Prefer resolving conflicts with specificity, source order, cascade layers, or markup/class structure.

## When this applies

- Stylesheets (`.css`, `.scss`) and `<style>` blocks in components.
- Tailwind: avoid arbitrary `!important` utilities (`!flex`, etc.) except where Tailwind documents them as the intended escape hatch—and still prefer restructuring before relying on them.

## Workflow

1. **If a rule is losing the cascade**: Raise specificity with a more precise selector (e.g. scope under a parent class), or reorder so the winning rule comes later in the same layer.
2. **If fighting third-party CSS**: Prefer a wrapper class, higher specificity without `!important`, or `@layer` so your layer orders after vendor layers when the stack supports it.
3. **If tempted to “fix” one-off bugs with `!important`**: Fix the underlying ordering/specificity instead; `!important` makes future changes harder and spreads.

## Techniques (prefer in this order)

| Approach | Notes |
|----------|--------|
| More specific selector | Add meaningful parent/context classes; avoid piling redundant IDs just to win. |
| Correct source order | Same specificity → later rule wins. |
| `@layer` | Order theme, components, utilities when using native cascade layers. |
| Restructure markup/classes | Often cleaner than selector arms races. |

## Exceptions (rare)

Only use `!important` when there is no practical alternative **and** the reason is documented in a short comment (e.g. unavoidable third-party inline style, accessibility override required by spec). Default answer is still “don’t.”

## Examples

**Avoid:**

```css
.button {
  display: flex !important;
}
```

**Prefer:**

```css
.card .button {
  display: flex;
}
```

**Avoid:**

```css
.hidden {
  display: none !important;
}
```

**Prefer:** One clear utility with sufficient specificity for its scope, or a single authoritative rule in the right layer—not `!important` to beat everything.

## Review checklist

- [ ] No new `!important` unless it meets the narrow exception above and is commented.
- [ ] Conflicts addressed via specificity, order, or layers—not escalation with `!important`.
- [ ] Tailwind: no gratuitous important-modifier utilities to paper over structure problems.
