# ADR-0012: Weapons and Ordnance System Overview

## Status
Accepted

## Context
The simulator has a weapons station with phasers, multiple ordnance types (homing torpedo, dumb torpedo, nuke), and target locking. We need a clear split of responsibilities and a single source of truth for weapon behavior and damage.

Key considerations:
- Phasers are instant-hit; ordnance are projectiles with different behaviors (see ADR-0010, ADR-0013)
- Target lock is shared (one current target) and used by phasers and ordnance
- Ammo and cooldowns are per ordnance type and must feel responsive without being overpowered
- Weapon effectiveness should reflect subsystem health and power

## Decision
We will centralize weapon firing and damage in `gameState.fireWeapon()` (state.js). The weapons station owns UI, ammo counts, cooldowns, and phaser charge; it calls `fireWeapon()` only when preconditions pass. Projectile configs live in state.js (`PROJECTILE_CONFIGS`); simulation updates projectiles and collisions; renderer draws beams and projectiles.

Responsibilities:
- **State (state.js)**: `fireWeapon(type, targetId)`, range checks for phasers (500), damage application, projectile creation, `PROJECTILE_CONFIGS`, `currentTarget`, `phaserBeams`, `projectiles`
- **Weapons station (weapons.js)**: Target select/display, canvas click targeting, phaser charge and cooldown, ordnance ammo and per-type cooldowns (`ORDNANCE_CONFIG`), firing buttons that gate on ammo/cooldown then call `gameState.fireWeapon()`
- **Simulation (simulation.js)**: Projectile movement, homing (turnRate), collision and nuke detonation (including player-only rule: blast ordnance detonates on player only after >1s active; see ADR-0013), phaser beam lifetime
- **Renderer (renderer.js)**: Drawing phaser beams and projectiles (torpedo, dumbTorpedo, nuke)

Phasers:
- Instant beam; range 500; damage 15 × effectiveness; effectiveness = (weapons.hp/100) × (weapons.power/100)
- Phaser charge (100 max, −20 per shot, recharge in station `update()`) and phaser cooldown (30 frames) are station-owned

Ordnance:
- Three types: torpedo (homing), dumbTorpedo (straight), nuke (proximity/splash; see ADR-0013)
- Ammo and cooldown per type in station; no ammo check in state—station refuses fire when ammo ≤ 0 or cooldown > 0
- Damage and behavior come from `PROJECTILE_CONFIGS`; effectiveness scales damage when spawning

Target lock:
- Single `gameState.currentTarget` (ship id or null); set via target dropdown or canvas click in weapons station
- Phasers and ordnance use `currentTarget` when no explicit targetId is passed

## Consequences

### Positive
- **Single authority**: All damage and projectile creation go through state
- **Clear ownership**: Station = UI and gating; state = rules and data; simulation = movement and hits
- **Consistency**: Same effectiveness and range rules for all callers (e.g. future NPC ordnance)
- **Extensibility**: New ordnance types require config in state + station UI + optional ADR for behavior

### Negative
- **Split logic**: Ammo/cooldown in station, damage in state—must keep in sync when adding weapons
- **No torpedo range gate in state**: Station shows “in range” (1500) but state does not enforce; could add if desired

### Mitigations
- Document ordnance types and config in this ADR and ADR-0010/0013
- Optional: add torpedo max range check in `fireWeapon()` for consistency with UI
