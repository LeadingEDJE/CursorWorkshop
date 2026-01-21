# ADR-003: Implement Fixed Timestep Simulation Loop

## Status
Accepted

## Context
The game requires deterministic physics and AI updates that should run at a consistent rate regardless of frame rate. Variable timestep would cause ships to move faster on powerful machines and create inconsistent behavior.

Key considerations:
- Physics and AI updates must be deterministic
- Game logic should be decoupled from rendering frame rate
- Need consistent behavior across different hardware
- Simulation should handle frame rate spikes gracefully

## Decision
We will implement a fixed timestep simulation loop running at 20Hz (50ms per tick), with rendering decoupled at the screen refresh rate.

Implementation:
- Simulation updates run at fixed 50ms intervals
- Rendering happens at variable rate (via `requestAnimationFrame`)
- Cap maximum ticks per frame to prevent spiral of death
- Game logic (physics, AI, collisions) runs in fixed timestep
- Visual updates (rendering) run at screen refresh rate

## Consequences

### Positive
- **Deterministic**: Same inputs produce same results regardless of frame rate
- **Consistent Behavior**: Ships move at same speed on all machines
- **Decoupled Rendering**: Smooth visuals even if simulation lags
- **Predictable**: Game logic timing is consistent and testable

### Negative
- **Complexity**: More complex than simple variable timestep
- **Potential Lag**: If machine can't keep up, simulation falls behind
- **Frame Skipping**: Visual updates may skip simulation frames
- **Fixed Rate**: Can't easily adjust simulation speed dynamically

### Mitigations
- Cap maximum ticks per frame (currently 5) to prevent spiral of death
- Use interpolation for smooth rendering between simulation ticks (future enhancement)
- Monitor performance and adjust tick rate if needed
