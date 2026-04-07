# Plan: Helm Autopilot System (ADR-0016)

**Status:** Planning document only — not implemented.

**Intent:** Capture the agreed specification for a future ADR and implementation. When ready, promote this into [docs/adrs/0016-helm-autopilot-system.md](../adrs/0016-helm-autopilot-system.md) and update [docs/adrs/README.md](../adrs/README.md).

---

## What We're Building

An autopilot mode for the helm station. When toggled on, autopilot operates in three behavioral modes:

- **Waypoint navigation** — steer toward the active waypoint.
- **Cruise** — fly straight when no waypoint (maintain heading and throttle).
- **Combat** — simple attack/evasion near hostile ships.

The helm tab shows an indicator when autopilot is active, visible from all stations.

---

## Key Context from the Codebase

- **Helm station** ([js/stations/helm.js](../../js/stations/helm.js)): Manual control of heading (`setHeading`, `turn`) and throttle (`setThrottle`). Heading changes are **instant** (no `turnRate` applied to the player ship).
- **Navigation station** ([js/stations/navigation.js](../../js/stations/navigation.js)): One-shot `autoNavigateToWaypoint` sets heading and 75% throttle once; it does **not** continuously steer.
- **Simulation** ([js/core/simulation.js](../../js/core/simulation.js)): `updatePlayerShip()` integrates position from `heading` + `velocity`. NPC ships use `turnRate` for gradual steering in `moveNPCShip()`.
- **State** ([js/core/state.js](../../js/core/state.js)): `playerShip` has `heading`, `velocity`, `maxVelocity`, `turnRate` (unused for player). `gameState.waypoint` is `{x,y}` or `null`.
- **Hostile detection** ([js/core/simulation.js](../../js/core/simulation.js)): Computes `nearestHostileDistance` and manages `alertLevel` (`normal`, `yellow`, `red`) with proximity thresholds (500, 1000, 1500 units).
- **Tab UI** ([index.html](../../index.html)): Helm uses `#tab-helm`; CSS has a `.badge` class suitable for an autopilot indicator.

---

## ADR Content Outline (for formal ADR)

### Context

- Helm requires constant manual steering to maintain course toward a waypoint.
- Navigation’s auto-navigate is a one-shot command, not a continuous system.
- NPC ships already demonstrate turn-rate-limited steering in the simulation.
- Player ship has a `turnRate` property that is currently unused.

### Decision

Autopilot is a toggleable mode on the helm station with the following behaviors.

**State**

- New `autopilot` boolean on `gameState.playerShip` (default `false`).
- Events: `autopilotEngaged`, `autopilotDisengaged`.

**Behavioral modes (priority order, each sim tick)**

1. **Combat mode** — when a hostile ship is within threat range (reuse existing `nearestHostileDistance` logic, ~1000 units):
   - **Healthy ship** (hull > 50%): steer toward nearest hostile (attack approach).
   - **Damaged ship** (hull ≤ 50%): steer away from nearest hostile (evasive retreat).
   - Throttle set to 100% in combat mode.
2. **Waypoint mode** — when `gameState.waypoint` exists and no hostiles in range:
   - Bearing to waypoint via `atan2`.
   - Adjust `heading` toward that bearing by at most `turnRate * engineEffectiveness` per tick (same pattern as `moveNPCShip`), shortest arc (port/starboard).
   - Throttle: cruise at 75% of `maxVelocity * engineEffectiveness`, decelerate on approach, full stop on arrival.
3. **Cruise mode** — when no waypoint and no hostiles:
   - Maintain current heading (fly straight).
   - Maintain current throttle (no speed changes).

**Auto-disengage**

- Player manually adjusts heading or throttle (manual override).
- Engine subsystem destroyed (0 HP).

**Note:** Waypoint arrival clears the waypoint and transitions to **cruise mode**; it does **not** disengage autopilot.

**UI (Helm station)**

- Toggle in helm controls (e.g. keyboard shortcut `P`).
- Indicator for autopilot status and current mode (cruise / waypoint / combat).
- Throttle, compass, turn controls visually dimmed but usable; interaction disengages autopilot.

**Tab indicator (all stations)**

- Small badge on `#tab-helm` (e.g. “AP” or a dot) when autopilot is active.
- Use existing `.badge` CSS; hidden when off.
- Sync via `autopilotEngaged` / `autopilotDisengaged` (and mode updates if needed) regardless of active station.

### Consequences

**Positive**

- Less manual workload for travel.
- Basic survival behavior near hostiles without helm focus.
- Reuses NPC turn-rate and hostile-detection patterns.
- `turnRate` used for player autopilot.
- Cross-station awareness via tab badge.
- Event-driven integration with other stations.

**Negative**

- More complexity in helm and simulation.
- Combat autopilot may be tactically weak vs. manual control.
- Mode transitions must be handled cleanly.
- Throttle may be written by both autopilot and helm UI.

**Mitigations**

- Keep autopilot logic in simulation for testability.
- Simple combat rules (approach vs. flee) stay predictable and overridable.
- Clear disengage rules; events for UI sync.

### Design note: manual steering vs. turn rate

Manual helm control is currently instant. Autopilot uses `turnRate`. A future ADR could align manual steering with `turnRate`; this plan treats that as separate from autopilot.

---

## Follow-up work (when implementing)

1. **Create** [docs/adrs/0016-helm-autopilot-system.md](../adrs/0016-helm-autopilot-system.md) — formal ADR (Status, Context, Decision, Consequences with Positive / Negative / Mitigations).
2. **Update** [docs/adrs/README.md](../adrs/README.md) — index entry for ADR-0016.
3. **Code** — `state.js`, `simulation.js`, `helm.js`, `main.js` (or equivalent wiring), `index.html`, `css/main.css` as needed.

This file does **not** track implementation status; remove or archive it after the ADR exists if you prefer a single source of truth.
