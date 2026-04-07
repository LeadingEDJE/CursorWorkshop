# ADR-0016: Helm Autopilot System

## Status

Accepted

## Context

The helm station requires constant manual steering to maintain course toward a waypoint. The navigation station provides a one-shot `autoNavigateToWaypoint` that sets heading and throttle once but does not continuously steer. NPC ships already use `turnRate` for gradual steering in `moveNPCShip()` (`js/core/simulation.js`), while the player ship’s `turnRate` is currently unused for manual helm input.

When no waypoint is set, players may still want hands-off flight (maintain heading and speed). Near hostile ships, basic automated attack or evasion can reduce cognitive load without replacing tactical play.

Key considerations:

- `gameState.playerShip` exposes `heading`, `velocity`, `maxVelocity`, `turnRate`, and hull (`hull` / `maxHull`).
- `gameState.waypoint` is `{ x, y }` or `null`; waypoint arrival is proximity-based in simulation.
- Hostile detection already exists: `nearestHostileDistance` and `alertLevel` (`normal`, `yellow`, `red`) use proximity thresholds (500, 1000, 1500 units) in `simulation.js`.
- The bridge uses tab buttons (`#tab-helm`, etc.) in `index.html`; `main.css` includes a `.badge` class suitable for a small autopilot indicator visible from any station.
- The project uses an event-driven model (ADR-0004); autopilot state changes should integrate with existing patterns.

## Decision

Introduce a **toggleable autopilot** mode controlled from the helm station. When engaged, autopilot applies steering and throttle in the simulation each tick using **gradual** heading changes limited by `turnRate` and engine effectiveness, consistent with NPC steering (not instant heading snaps like current manual helm).

### State and events

- Add `autopilot` (boolean, default `false`) on `gameState.playerShip` (or equivalent centralized player state).
- Emit `autopilotEngaged` and `autopilotDisengaged` when toggled.
- Optionally emit or carry **current mode** (`cruise` | `waypoint` | `combat`) for UI; helm should show status and current mode.

### Behavioral modes (priority, each simulation tick)

1. **Combat mode** — when at least one hostile ship (`faction === 'hostile'`) is within **threat range** (~1000 units, aligned with existing yellow-alert proximity in `simulation.js`):
   - Find **nearest** hostile to the player.
   - **Healthy ship** — if `hull / maxHull > 0.5`: steer **toward** that hostile (attack approach).
   - **Damaged ship** — if `hull / maxHull <= 0.5`: steer **away** from that hostile (evasive retreat).
   - **Throttle**: 100% of effective max speed (respect `maxVelocity` and engine subsystem effectiveness as elsewhere).
2. **Waypoint mode** — when `gameState.waypoint` is set and no hostile is within threat range:
   - Bearing to waypoint via `atan2(dy, dx)`.
   - Adjust `heading` toward that bearing by at most `turnRate * engineEffectiveness` per tick (shortest arc, port or starboard), matching `moveNPCShip` patterns.
   - **Throttle**: cruise at ~75% of effective max; decelerate when approaching the waypoint; full stop on arrival.
3. **Cruise mode** — when there is no waypoint and no hostile in threat range:
   - Maintain **current heading** (fly straight).
   - Maintain **current throttle** (autopilot does not change velocity).

### Waypoint arrival and autopilot lifetime

- When the player reaches the waypoint (existing proximity threshold, e.g. 20 units), clear the waypoint per current rules and **transition to cruise mode**; **do not** disengage autopilot.
- Clearing the waypoint manually while autopilot is on transitions to cruise mode.

### Auto-disengage conditions

- **Manual override**: player changes heading or throttle via helm (slider, compass, turn buttons, keyboard, map steer) — disengages autopilot.
- **Engines destroyed**: engine subsystem at 0 HP — disengage autopilot (cannot steer/thrust meaningfully).

### UI — helm station

- Toggle control (e.g. button) and keyboard shortcut (e.g. `P`).
- Show autopilot **on/off** and **active mode** (cruise / waypoint / combat).
- While autopilot is on, dim helm controls (throttle, compass, turn controls) but keep them interactive; interaction disengages autopilot.

### UI — helm tab (global visibility)

- Add a small indicator on `#tab-helm` (e.g. “AP” or a dot) using the existing `.badge` pattern; **hidden** when autopilot is off.
- Subscribe to `autopilotEngaged` / `autopilotDisengaged` (and mode updates if separate) so the badge stays correct regardless of which station tab is active.

### Implementation placement

- Core autopilot logic runs in **`simulation.js`** (or a small module called from it) so behavior is deterministic, testable, and independent of helm DOM code.
- Helm and `main.js` (or tab wiring) only reflect state and handle input/disengage.

### Design note: manual helm vs turn rate

Manual helm currently sets heading **instantly**. Autopilot uses **gradual** turns via `turnRate`. Unifying manual helm with `turnRate` is a **separate** follow-up decision; this ADR only requires autopilot to respect `turnRate` and engine limits.

## Consequences

### Positive

- Less micromanagement on long transits and simple combat situations.
- Reuses hostile-distance concepts and NPC-style steering.
- `turnRate` on the player ship is used for automated flight.
- Helm tab badge gives **cross-station awareness** of autopilot state.
- Event-driven updates fit existing architecture (ADR-0004).

### Negative

- More branches in the simulation loop and mode transitions (cruise ↔ combat ↔ waypoint).
- Simple combat AI may be predictable or tactically poor versus skilled manual play.
- Throttle and heading may be written by both autopilot and helm UI; careful disengage and sync rules are required.

### Mitigations

- Keep combat rules minimal (approach vs flee by hull ratio) so players can override quickly.
- Centralize autopilot in simulation; use events for UI; document manual override.
- Tests can target pure helpers (bearing, mode selection, turn delta clamping) if extracted.
