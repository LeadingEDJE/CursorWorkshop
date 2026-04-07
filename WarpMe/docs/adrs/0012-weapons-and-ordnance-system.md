# ADR-0012: Weapons and Ordnance System Overview

## Status
Accepted

## Context
The simulator has a weapons station with phasers, multiple ordnance types (homing torpedo, dumb torpedo, nuke), and target locking. We need a clear split of responsibilities and a single source of truth for weapon behavior and damage.

Key considerations:
- Phasers are instant-hit; ordnance are projectiles with different behaviors (see ADR-0010, ADR-0013)
- Target lock is shared (one current target) and used by phasers and ordnance
- Ammo and cooldowns are per ordnance type and must feel responsive without being overpowered
- Ordnance magazines should replenish over time (at tunable rates per type) so engagements can last without permanently exhausting torpedoes and nukes
- Weapon effectiveness should reflect subsystem health and power

## Decision
We will centralize weapon firing and damage in `gameState.fireWeapon()` (state.js). The weapons station owns UI, ammo counts, cooldowns, and phaser charge; it calls `fireWeapon()` only when preconditions pass. Projectile configs live in state.js (`PROJECTILE_CONFIGS`); simulation updates projectiles and collisions; renderer draws beams and projectiles.

Responsibilities:
- **State (state.js)**: `fireWeapon(type, targetId)`, range checks for phasers (500), damage application, projectile creation, `PROJECTILE_CONFIGS`, `currentTarget`, `phaserBeams`, `projectiles`
- **Weapons station (weapons.js)**: Target select/display, canvas click targeting, phaser charge and cooldown, ordnance ammo counts, per-type cooldowns, **magazine recharge** (`ORDNANCE_CONFIG` including `rechargePerTick` and per-type fractional accumulators), firing buttons that gate on ammo/cooldown then call `gameState.fireWeapon()`
- **Simulation (simulation.js)**: Projectile movement, homing (turnRate), collision and nuke detonation (including player-only rule: blast ordnance detonates on player only after >1s active; see ADR-0013), phaser beam lifetime
- **Renderer (renderer.js)**: Drawing phaser beams and projectiles (torpedo, dumbTorpedo, nuke)

Phasers:
- Instant beam; range 500; damage 15 × effectiveness; effectiveness = (weapons.hp/100) × (weapons.power/100)
- Phaser charge (100 max, −20 per shot, recharge in station `update()`) and phaser cooldown (30 frames) are station-owned

Ordnance:
- Three types: torpedo (homing), dumbTorpedo (straight), nuke (proximity/splash; see ADR-0013)
- Ammo, per-shot cooldown, and **magazine recharge** per type in station; no ammo check in state—station refuses fire when ammo ≤ 0 or cooldown > 0
- Damage and behavior come from `PROJECTILE_CONFIGS`; effectiveness scales damage when spawning

Magazine recharge (ordnance):
- Each type has `rechargePerTick` in `ORDNANCE_CONFIG`: fraction of one round added per simulation tick when below `maxAmmo`, at **100%** weapons subsystem hp and power. Actual rate is multiplied by `(weapons.hp/100) × (weapons.power/100)`—same scaling idea as phaser recharge in the same `update()` tick (~20 ticks/s at 50 ms fixed step).
- Each type keeps a **fractional accumulator**; when the accumulator reaches ≥ 1, one round is added (count incremented, accumulator −1) until `maxAmmo` or the accumulator drops below 1.
- When count is already at `maxAmmo`, the accumulator is **not** advanced (no banking progress while full).
- Default pacing targets (at full subsystem): homing ~12 s per round, dumb ~10 s per round, nuke ~15 s per round. Formula: `rechargePerTick = 1 / (targetSeconds × 20)`.
- Per-shot cooldown after firing is unchanged and remains independent of recharge (player can have ammo regrowing while waiting out cooldown).

Target lock:
- Single `gameState.currentTarget` (ship id or null); set via target dropdown or canvas click in weapons station
- Phasers and ordnance use `currentTarget` when no explicit targetId is passed

## Consequences

### Positive
- **Single authority**: All damage and projectile creation go through state
- **Clear ownership**: Station = UI and gating; state = rules and data; simulation = movement and hits
- **Consistency**: Same effectiveness and range rules for all callers (e.g. future NPC ordnance)
- **Extensibility**: New ordnance types require config in state + station UI + optional ADR for behavior
- **Sustained combat**: Ordnance magazines recover without a separate engineering action; pacing is data-driven via `rechargePerTick`

### Negative
- **Split logic**: Ammo, cooldown, and recharge in station, damage in state—must keep in sync when adding weapons
- **Tuning surface**: Balance depends on both `rechargePerTick` and per-shot `cooldown` plus `maxAmmo`
- **No torpedo range gate in state**: Station shows “in range” (1500) but state does not enforce; could add if desired

### Mitigations
- Document ordnance types, cooldowns, and recharge in this ADR and ADR-0010/0013
- Keep all magazine tuning in `ORDNANCE_CONFIG` (maxAmmo, cooldown, rechargePerTick) with comments in weapons.js
- Optional: add torpedo max range check in `fireWeapon()` for consistency with UI
