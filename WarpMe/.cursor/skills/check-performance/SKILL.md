---
name: check-performance
description: Analyzes code for performance issues including unnecessary work, memory leaks, and inefficient algorithms. Use when the user asks to check for performance issues, optimize code, find bottlenecks, or mentions slowness or lag.
---

# Check Code for Performance Issues

When the user asks to check their code for performance issues, systematically analyze the relevant files and report findings in a structured way.

## Workflow

1. **Scope**: Identify which files or modules to analyze (entire project, opened file, or user-specified path).
2. **Run checklist**: Go through each category below for the in-scope code.
3. **Report**: Use the output format at the end. Only include findings that apply; omit empty categories.

## Performance Checklist

### Runtime & algorithms

- **Expensive work in hot paths**: Loops, event handlers, or frequently-called functions doing heavy work (e.g. DOM queries, regex, large object creation). Prefer moving work outside the loop or caching.
- **N+1 or repeated work**: Multiple queries or iterations that could be one (batch, single query, or precomputed structure).
- **Inefficient data structures**: Linear search where a `Map`/`Set` or index would be O(1); unnecessary array operations (e.g. repeated `find` instead of a lookup).
- **Synchronous blocking**: Long-running synchronous code on the main thread (large JSON parse, heavy computation). Prefer chunking, Web Workers, or async.
- **Unnecessary re-computation**: Values recomputed every time instead of memoizing or computing once (e.g. in render or in a frequently-called handler).

### Memory

- **Leaks**: Event listeners, timers, subscriptions, or closures holding references to DOM or large objects after they’re no longer needed. Look for missing `removeEventListener`, `clearInterval`/`clearTimeout`, or unsubscribe.
- **Large retained data**: Keeping large arrays, caches, or logs in memory without bounds or eviction.
- **Accidental retention**: Closures capturing big objects or DOM nodes longer than needed.

### DOM & rendering (front-end)

- **Layout thrash**: Repeated read-write-read patterns (e.g. `offsetHeight` then style change in a loop). Batch reads, then batch writes.
- **Excessive reflows/repaints**: Style or DOM changes that trigger layout (e.g. reading `offsetTop`, changing classes) in tight loops or on scroll/resize without debounce or throttle.
- **Heavy work in render**: Expensive computation or DOM creation during render; prefer derived state, memoization, or moving work off the critical path.
- **Missing virtualization**: Long lists rendered as many DOM nodes; recommend virtualized lists for large datasets.
- **Oversized or unoptimized assets**: Large images without sizing, lazy loading, or appropriate format (e.g. WebP, responsive srcset).

### I/O & network

- **Redundant requests**: Same or overlapping data fetched repeatedly; suggest caching, request coalescing, or single source of truth.
- **No debounce/throttle**: Search, resize, or scroll handlers firing requests or heavy logic on every event.
- **Blocking or unnecessary work on critical path**: Data or assets that could be loaded lazily or in the background.

## Output format

Use this structure when reporting. Omit sections with no findings.

```markdown
# Performance check

## Summary
[1–2 sentences: overall severity and main areas of concern.]

## Critical
[Issues that can cause noticeable slowness, freezes, or memory growth. Include file/line or component and a short recommendation.]

## Suggestions
[Improvements that would help. Include file/line or component and a short recommendation.]

## Optional / follow-up
[Worth measuring (e.g. with profiler) or optimizing later.]
```

- **Critical**: Must-fix for perceived performance (e.g. work in hot path, leak, layout thrash).
- **Suggestions**: Clear wins (e.g. caching, batching, debounce, better data structure).
- **Optional**: Nice-to-have or needs profiling to confirm.

Be specific: name files, functions, or line ranges and give one concrete next step per finding.

## Optional: Deeper analysis

If the user wants more detail or the codebase is large:

- Suggest running the app and using DevTools (Performance, Memory, Network) and report what to look for.
- For React: mention React DevTools Profiler and patterns like unnecessary re-renders, missing `React.memo`/`useMemo`/`useCallback` where appropriate.
- For vanilla JS: mention identifying hot functions in the Performance tab and checking for listener/closure leaks in Memory snapshots.

Keep the main SKILL.md focused on the checklist and report format; add framework-specific notes in a separate reference only if the skill grows.
