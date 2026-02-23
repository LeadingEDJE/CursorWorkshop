# ADR-010: Implement Homing Torpedo Behavior

## Status
Accepted

## Context
Torpedoes were originally implemented as simple projectiles that travel in a straight line. To make them more effective and interesting, we wanted to add homing behavior so they can track and hit moving targets.

Key considerations:
- Torpedoes should be able to track moving targets
- Need realistic turn rate limits (not instant tracking)
- Should continue on last heading if target is destroyed
- Must balance gameplay (not too easy, not too hard)
- We support multiple ordnance types: homing torpedo, dumb torpedo (no homing), and nuke (slight homing)

## Decision
We will implement homing behavior driven by a per-type `turnRate` in projectile config (in `state.js`). Only projectiles with `turnRate > 0` and a valid `targetId` will home; others (e.g. dumb torpedo) travel in a straight line.

Implementation:
- Projectile configs define `turnRate` per type: homing torpedo 6°/frame, dumb torpedo 0, nuke 2°/frame
- Projectiles with `turnRate > 0` and `targetId` calculate angle to target each frame and turn toward it at max turn rate
- If target is destroyed, projectile continues on last heading
- Turn rate creates realistic tracking behavior (not instant)

## Consequences

### Positive
- **More Effective**: Torpedoes can hit moving targets
- **Realistic**: Limited turn rate feels more believable
- **Gameplay**: Makes torpedoes more useful and strategic
- **Visual Interest**: Watching torpedoes curve toward targets is engaging

### Negative
- **Complexity**: Adds complexity to projectile update logic
- **Balance**: May make torpedoes too powerful (mitigated by turn rate)
- **Performance**: Slight performance cost for angle calculations per torpedo

### Mitigations
- Turn rate (6°/frame for homing) prevents instant tracking, maintains challenge
- Dumb torpedo uses `turnRate: 0` for straight-line, higher velocity trade-off
- Torpedo lifetime (400 frames = 20 seconds) limits range
- If target destroyed, projectile continues straight (wasteful but realistic)
- Performance impact is minimal (simple math operations)
