# ADR-0015: Target Status Display in Tactical Sidebar

## Status
Accepted

## Context
ADR-0014 introduced hull/shield status bars drawn above ships on the canvas, giving
the player at-a-glance combat state during gameplay. However, the tactical station
sidebar had no equivalent: the SCAN TARGET panel only showed hull and shield values as
plain text rows after a scan completed. Before scanning, the panel showed only identity
and distance — no visual indication of a target's combat state.

Key considerations:
- Players need to assess a target's combat state without leaving the tactical view or
  waiting for a scan to complete.
- The canvas status bars (ADR-0014) are only visible when the target is on screen and
  may be hard to read at small zoom scales.
- Hull and shield values are already present in the ship model (`hull`, `maxHull`,
  `shieldStrength`, `maxShieldStrength`, `subsystems.shields.power`).
- The existing `updateScanInfo()` method is already called every frame when a target
  is selected, so live updates are available without new game-loop work.
- The project avoids external dependencies (ADR-0001); any new UI must use existing
  CSS primitives.

## Decision

Add a **TARGET STATUS** block inside the SCAN TARGET panel in the tactical sidebar.
The block renders hull and shield progress bars with a short condition label,
updating in real time from `gameState` without requiring a rescan.

**Option A (always-visible layout, scan-gated values)** is used:
- When a target is selected and **scanned**, the block shows hull %, shield %, and a
  condition label ("Nominal", "Hull Damaged", "Shields Critical", etc.), each with a
  color-coded progress bar.
- When a target is selected but **not scanned**, the block renders empty bars with
  "---" values and a "Scan target for details" hint, so layout remains stable.
- When **no target** is selected, the block is empty.

Implementation details:

- **HTML**: A `<div id="target-status">` placeholder is injected between `#scan-info`
  and the SCAN button in `tactical.js render()`. It carries `aria-live="polite"` and an
  `aria-label` so screen readers announce updates.
- **`updateTargetStatus()`**: New method in `TacticalStation` that writes the bar HTML
  into `#target-status`. Called at the end of `updateScanInfo()`, which already runs
  every frame when a target is selected.
- **Color helpers (pure functions exported from `tactical.js`)**:
  - `getHullColor(hullRatio)` — mirrors `renderer.getHullColor()` (green → yellow → red).
  - `getShieldColor(shieldRatio, shieldsOnline)` — cyan when healthy, dim gray when
    offline or depleted.
  - `getConditionLabel(ship)` — derives a short status string from hull and shield ratios.
  - `getConditionClass(label)` — maps label to CSS modifier (`nominal`, `warning`, `critical`).
- **CSS**: New `.target-status*` classes added to `main.css` (`.target-status-row`,
  `.target-status-label`, `.target-status-bar`, `.target-status-fill`, etc.), reusing
  the existing spacing and color variables. Hull bar fill color is set via inline style
  so it reflects the continuous green-to-red gradient.
- **Hull/shield plain-text rows removed** from the scanned branch of `updateScanInfo()`
  since the bar block now provides that information with richer visual context.
- **Tests**: `tests/tactical.test.js` covers all four pure helpers with the same
  custom `assert`/`describe` harness used by `tests/renderer.test.js`.

## Consequences

### Positive
- **Immediate combat assessment** — hull and shield bars are visible as soon as a
  target is selected, even before scanning.
- **Live updates** — bars reflect real-time damage without requiring a rescan, using
  data that already drives the canvas.
- **Consistent visual language** — hull color mapping matches ADR-0014 (green → yellow →
  red); shield bar reuses the existing cyan palette.
- **Accessible** — bars carry `role="progressbar"` with `aria-valuenow/min/max`; condition
  text is readable by screen readers; information is not conveyed by color alone.
- **Testable** — helper functions are pure and exported, verified by 37 unit tests.
- **No new dependencies** — implementation uses existing CSS variables and DOM APIs.

### Negative
- **Hull-color logic duplicated** — `getHullColor()` in `tactical.js` mirrors
  `renderer.getHullColor()` rather than sharing a common module, since extracting a
  shared utility would be a broader refactor outside this feature's scope.
- **SCAN TARGET panel height increases** — the status block adds ~55 px to the panel;
  at the smallest viewport widths this may push the SCAN button further down.

### Mitigations
- The duplicated color logic is a small pure function (12 lines) with identical test
  coverage in both `renderer.test.js` and `tactical.test.js`, so drift is detectable.
- The layout uses compact 8px bars and minimal margins; the SCAN button remains within
  the visible sidebar in normal usage. Responsive styles inherit from the existing
  `.tactical-sidebar .panel` flex wrap rules.
