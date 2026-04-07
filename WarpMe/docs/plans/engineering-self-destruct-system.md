# Plan: Engineering Self-Destruct System (ADR-0017 candidate)

**Status:** Planning document only — not implemented.

**Intent:** Define a clear self-destruct specification for the Engineering station before code changes. If approved, promote this plan into [docs/adrs/0017-engineering-self-destruct-system.md](../adrs/0017-engineering-self-destruct-system.md) and update [docs/adrs/README.md](../adrs/README.md).

---

## What We're Building

A ship self-destruct capability controlled from Engineering, designed as a deliberate, high-friction action with clear warning states:

- Crew can **arm** self-destruct from Engineering only.
- A short **countdown** runs with visible status and comms warnings.
- Crew can **abort** during countdown from Engineering.
- If countdown completes, the player ship is destroyed with area-effect damage near the blast.

Goals:

- Keep behavior predictable and auditable through explicit state transitions.
- Reuse existing simulation/state/event patterns already used for weapons, alerts, and destruction.
- Avoid accidental activation by requiring two-step confirmation and station-scoped controls.

---

## Key Context from the Codebase

- **Engineering station UI + handlers** ([js/stations/engineering.js](../../js/stations/engineering.js)): Renders panel-based controls, binds station-local actions, and listens to `gameState` events (`powerChanged`, `alertChanged`, `repairStarted`).
- **Central state + event bus** ([js/core/state.js](../../js/core/state.js)): Single `gameState` object with `emit/on` listeners, comms messaging (`addCommsMessage`), and destruction event (`playerDestroyed`).
- **Simulation fixed tick loop** ([js/core/simulation.js](../../js/core/simulation.js)): 20 Hz update loop where timer/cooldown-style mechanics already run (`updateRepairCooldowns`, projectile lifetime).
- **Weapons blast precedent** ([js/core/simulation.js](../../js/core/simulation.js), [js/core/state.js](../../js/core/state.js), [docs/adrs/0013-nuke-ordnance-behavior.md](../adrs/0013-nuke-ordnance-behavior.md)): Existing area-damage and explosion effect flow can be reused for self-destruct blast semantics.
- **Station lifecycle + app wiring** ([js/main.js](../../js/main.js)): Stations are swapped by tab and re-initialized; long-lived behavior should be owned by state/simulation, not station-local instance state.
- **Alert controls in Engineering** ([js/stations/engineering.js](../../js/stations/engineering.js)): Existing red/yellow/normal controls provide a natural integration point for escalation behavior when self-destruct is armed.

---

## Decision / Specification

### 1) State model

Add a dedicated `selfDestruct` object on `gameState`:

- `status`: `'idle' | 'armed' | 'countdown' | 'aborted' | 'executed'`
- `countdownTicksRemaining`: integer ticks remaining at 20 Hz.
- `countdownSecondsTotal`: configured duration in seconds (default v1: `15`).
- `armedBy`: string metadata (`'engineering'` in v1).
- `lastChangeTime`: `gameState.gameTime` snapshot for diagnostics/UI.

Design rule: self-destruct state is global, persisted in `gameState`, and never stored only in station class instance fields.

### 2) Events

Define explicit events so all stations can react without tight coupling:

- `selfDestructArmed`
- `selfDestructStarted`
- `selfDestructTick` (optional throttled emission; e.g., once per second)
- `selfDestructAborted`
- `selfDestructExecuted`

Payload should include `status`, `countdownTicksRemaining`, and derived seconds remaining when relevant.

### 3) Engineering UI behavior

Add a new Engineering panel: **SELF-DESTRUCT**.

Panel states:

- **Idle:** `ARM SELF-DESTRUCT` button (danger styling), explanatory warning text.
- **Armed (pre-countdown confirm window):** `CONFIRM` + `CANCEL` controls.
- **Countdown active:** large timer, `ABORT` control, escalating visual urgency.
- **Aborted:** transient message, then return to Idle.
- **Executed:** controls disabled; ship destruction flow owns final UX.

Safety requirements:

- Two-step activation in same station session: arm, then confirm.
- Confirmation auto-expires after short window (v1: 5 seconds) back to idle if not confirmed.
- Only one active self-destruct sequence at a time.

### 4) Countdown and timing rules

- Countdown runs in simulation tick updates (not `setTimeout`) to align with existing deterministic loop.
- Initial duration: 15 seconds (`countdownSecondsTotal * 20` ticks).
- Comms warning cadence:
  - On start: "Self-destruct sequence initiated."
  - Remaining 10, 5, 3, 2, 1 seconds: alert messages.
- While active, force alert level to red (unless already red).

### 5) Abort rules

Abort is allowed only while `status === 'countdown'`.

- Trigger source in v1: Engineering panel abort button only.
- Abort resets `selfDestruct` to `aborted`, emits event, sends comms entry, then transitions to `idle`.
- Abort does not repair or otherwise modify ship subsystems/hull.

### 6) Execute rules

When countdown reaches zero:

- Transition to `executed`.
- Apply catastrophic destruction to player ship via existing damage/destruction pathway (reuse `damageShip` + `playerDestroyed` behavior semantics rather than inventing a parallel "dead" path).
- Spawn explosion effect and radial damage similar to existing blast logic:
  - v1 blast radius target: 250 world units (separate config from nuke).
  - Damage all ships in radius with linear falloff from a high base value (enough to usually destroy close ships).
- Emit `selfDestructExecuted` and comms log "Self-destruct executed."

### 7) Interaction with existing systems

- **Weapons/projectiles:** No special cancellation; normal simulation order applies until execution tick.
- **Navigation/helm/other stations:** They remain operable during countdown in v1 (no global lock), but any UI may optionally display countdown status via events.
- **Station switching:** Sequence continues if user leaves Engineering because canonical state is in `gameState`.
- **Pause behavior:** Countdown does not advance while `gameState.isPaused` is true (inherits simulation pause semantics).

### 8) Edge cases

- Repeated arm/confirm clicks are idempotent and do not duplicate events.
- If player ship is destroyed by enemy fire during countdown, sequence ends naturally through existing destruction handling (self-destruct events should not double-fire).
- Reset/new scenario must restore self-destruct state to `idle`.
- No NPC self-destruct in v1.

---

## Consequences

### Positive

- Clear high-risk command flow with explicit state and event boundaries.
- Reuses existing architecture (singleton state, fixed-tick simulation, comms, destruction events).
- Countdown in simulation keeps timing behavior deterministic and easier to test.
- Minimal coupling: Engineering initiates, core systems execute.

### Negative

- Adds another cross-cutting state machine touching state, simulation, and station UI.
- Potential confusion if countdown is not visible outside Engineering.
- Player may accidentally trigger sequence if warnings are too subtle.

### Mitigations

- Keep state transitions explicit and event-driven.
- Add strong visual hierarchy and warning text in Engineering panel.
- Add comms warnings and red-alert escalation to improve situational awareness.
- Consider a cross-station top-nav badge as follow-up if playtesting shows discoverability issues.

---

## Design Notes / Future Work

- **Out of scope for v1:** Multi-role authorization (e.g., engineering + command dual-key), voice confirmation, or code phrase entry.
- **Potential follow-up ADR:** "Global critical-state banner/badge system" for countdowns and emergency states.
- **Balancing follow-up:** Tune blast radius/damage and countdown length after playtesting.

---

## Follow-up Work (later, not part of this pass)

- [ ] Create formal ADR: `docs/adrs/0017-engineering-self-destruct-system.md`.
- [ ] Add ADR index row in `docs/adrs/README.md` for ADR-0017.
- [ ] Implementation pass across:
  - `js/core/state.js` (state shape + events + API)
  - `js/core/simulation.js` (countdown ticking + execution effects)
  - `js/stations/engineering.js` (panel UI + controls)
  - `css/main.css` (self-destruct panel and urgency states)
  - `js/main.js` and/or station listeners for optional cross-station indicator wiring

This plan intentionally does not implement code or ADR registration.
