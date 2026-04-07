# ADR-0014: Ship Status Visual System

## Status
Accepted

## Context
The tactical and weapons canvas views showed ships as plain colored triangles with no
indication of battle damage or shield degradation. Players had no way to assess a ship's
combat state at a glance — they had to open the scan panel to see hull and shield numbers.

Key considerations:
- Hull and shield values are already tracked in the ship data model (`hull`, `maxHull`,
  `shieldStrength`, `maxShieldStrength`, subsystem health/power).
- All canvas rendering is centralised in the `Renderer` singleton (ADR-005). Adding new
  visuals should stay in that single module rather than spread across stations.
- The project deliberately avoids external dependencies (ADR-001). No third-party particle
  or effects library should be introduced.
- Performance matters: the render loop runs at up to 60 fps with many simultaneous ships,
  projectiles, and effects.

## Decision

Extend the existing `Renderer` class with a self-contained ship status visual system
consisting of four layers:

1. **Enhanced shield bubble** — radial gradient fill whose colour shifts from cyan (healthy)
   through amber to red as shield strength drops. The bubble outline pulses subtly and
   flickers rapidly when shields fall below 30 %, giving clear visual feedback of imminent
   shield failure.

2. **Hull damage visuals** — two mechanisms applied inside `drawShip()`:
   - A semi-transparent red overlay drawn over the ship polygon whose opacity increases as
     hull drops below 80 %, culminating in an electrical-failure flicker at 25 % or below.
   - Deterministic "scar" lines (seeded from the ship's ID so they remain stable across
     frames) rendered below 50 % hull, coloured amber to read as heat damage.

3. **Hull / shield status bars** — two thin horizontal bars drawn above each ship in screen
   space (hull: green → red; shields: cyan). Bars are shown only for the player ship,
   scanned ships, friendly faction ships, and the current weapons target so unscanned
   hostiles remain appropriately opaque.

4. **Smoke and fire particle trails** — a lightweight particle pool (capped at 600 entries)
   emitting smoke (grey, hull < 70 %) and fire (orange/yellow, hull < 35 %) particles each
   frame. Smoke is drawn before ships; fire is drawn after, creating visual depth. Emission
   rate and particle velocity scale with damage severity so lightly damaged ships trail a
   wisp of smoke while critical ships burn visibly.

All logic lives in `js/core/renderer.js`. No new modules or dependencies are added.

## Consequences

### Positive
- **Immediate tactical clarity** — a glance at the canvas now reveals each ship's combat
  state without consulting the scan panel.
- **Single source of truth** — all visual rules are colocated in `Renderer`, consistent
  across tactical and weapons station views.
- **No new dependencies** — the implementation uses only the existing Canvas 2D API.
- **Deterministic scars** — scar geometry is derived from the ship ID, so marks are stable
  across frames and do not flicker unpredictably.
- **Testable pure logic** — threshold functions (`shouldEmitSmoke`, `getHullColor`, etc.)
  are pure and covered by `tests/renderer.test.js`.

### Negative
- **Particle pool overhead** — up to 600 live particles are updated and drawn every frame.
  At very high ship counts this may add measurable CPU cost.
- **Status bar clutter** — at small zoom scales (many ships visible) bars can overlap and
  reduce readability of the canvas.
- **drawShip complexity** — the method's cyclomatic complexity increases due to the added
  damage and shield branches.

### Mitigations
- The particle pool is hard-capped at 600 entries; oldest particles are evicted when the
  cap is reached.
- Status bar visibility is gated to player / scanned / targeted ships to limit on-screen
  noise; bar width is proportional to ship size so they scale with zoom.
- The `drawShip` complexity is accepted as an incremental increase within an already complex
  rendering method; future refactoring can extract `drawShipDamage()` and
  `drawShipShields()` helpers if needed.
