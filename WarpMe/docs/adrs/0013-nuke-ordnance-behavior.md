# ADR-0013: Nuke Ordnance Behavior (Proximity Detonation and Splash Damage)

## Status
Accepted

## Context
Nukes are a high-impact ordnance type that should feel distinct from homing and dumb torpedoes: area effect, proximity fusing, and dramatic payoff. We need clear rules for when they detonate and how damage is applied to multiple ships.

Key considerations:
- Nukes should be able to damage multiple ships in a blast radius
- Proximity fusing: detonate when close to any valid ship (not only the locked target)
- Direct hit vs splash: full damage on direct contact, falloff with distance for ships in blast radius
- If nuke expires (lifetime) without hitting, it should still detonate rather than vanish silently

## Decision
We will implement nuke behavior in the simulation layer with config in state.js: `blastRadius`, `splashDamage`, `proximityRadius`. Nukes detonate on (1) proximity to any valid ship (excluding launcher), (2) direct collision, or (3) lifetime expiry. On detonation, all ships within `blastRadius` take damage: direct hit uses full `damage`, otherwise `splashDamage × (1 − dist/blastRadius)`.

Implementation:
- **Config (state.js)**: Nuke has `blastRadius: 200`, `splashDamage: 50`, `proximityRadius: 40`, `damage: 80` (direct). Other ordnance use `blastRadius: 0`, `splashDamage: 0`, `proximityRadius: 0`. Projectiles store `initialLifetime` (same as `lifetime` at spawn) so age-in-flight can be computed in simulation.
- **Proximity**: Each frame, if `proximityRadius > 0`, check distance to any ship that is not the source; if within `proximityRadius`, call `detonateProjectile(proj, i)` and remove projectile.
- **Collision**: On direct hit (projectile within ship.size + proj.size), if `blastRadius > 0` call `detonateProjectile` instead of applying single-target damage, **except** when the hit target is the player ship: ordnance detonates on the player only if it has been active for more than one second (age in ticks = `initialLifetime - lifetime`; 1 second = 20 ticks at 50 ms/tick). If the projectile hits the player before that, only direct damage is applied and the projectile is removed (no detonation/splash).
- **Lifetime expiry**: When `lifetime <= 0` and `blastRadius > 0`, detonate in place instead of removing the projectile silently.
- **Detonation**: `detonateProjectile(proj, index)` applies to all ships in `blastRadius`: direct hit = `proj.damage`, else `splashDamage × (1 − dist/blastRadius)`; emits `nukeDetonation` for visuals/audio; removes projectile.

**Out of scope for this ADR:** How many nukes the player carries, how fast the magazine refills after firing, and per-shot launch cooldown are weapons-station concerns (`ORDNANCE_CONFIG` in `weapons.js`, including `rechargePerTick` and accumulators). See **ADR-0012** for magazine recharge and ordnance ownership; this ADR covers only in-flight detonation and damage.

## Consequences

### Positive
- **Distinct gameplay**: Nukes reward positioning and create risk for friendlies in blast
- **Predictable rules**: Proximity, collision, and expiry all documented and consistent
- **Reusable**: Same detonation path for proximity, collision, and expiry
- **Scalable**: Damage scaled by weapon effectiveness when projectile is created (state.js)
- **Player balance**: Full detonation on the player only after >1s in flight avoids instant point-blank nuke payoff; early hits still apply direct damage

### Negative
- **Friendly fire**: Player nukes can damage player ship if inside blast radius
- **Complexity**: More branches in projectile update (proximity check, blast-radius collision, expiry detonation)

### Mitigations
- UI and comms can warn when target is very close (risk to self)
- Single `detonateProjectile()` keeps blast logic in one place; config-driven so other ordnance stay simple
