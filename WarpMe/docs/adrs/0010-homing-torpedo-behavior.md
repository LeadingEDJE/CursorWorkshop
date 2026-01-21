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

## Decision
We will implement homing behavior for torpedoes that have a `targetId`. Torpedoes will gradually turn toward their target with a limited turn rate of 6 degrees per frame.

Implementation:
- Torpedoes with `targetId` calculate angle to target each frame
- Turn toward target at maximum rate of 6 degrees per frame
- If target is destroyed, torpedo continues on last heading
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
- Turn rate (6°/frame) prevents instant tracking, maintains challenge
- Torpedo lifetime (400 frames = 20 seconds) limits range
- If target destroyed, torpedo continues straight (wasteful but realistic)
- Performance impact is minimal (simple math operations)
