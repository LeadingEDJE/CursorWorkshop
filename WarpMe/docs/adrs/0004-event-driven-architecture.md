# ADR-004: Use Event-Driven Architecture for State Changes

## Status
Accepted

## Context
Multiple station modules need to react to game state changes without tight coupling. Stations shouldn't need to know about each other or poll for changes.

Key considerations:
- Six different stations need to update when state changes
- Stations should be loosely coupled
- Need to add new listeners without modifying emitters
- State changes should trigger UI updates automatically

## Decision
We will implement an event-driven architecture where `GameState` emits events on state changes, and stations subscribe to relevant events.

Implementation:
- `GameState` class includes event emitter methods (`on`, `off`, `emit`)
- State-changing methods emit events (e.g., `shipDamaged`, `weaponFired`, `alertChanged`)
- Stations subscribe to events they care about
- Events carry relevant data payloads

## Consequences

### Positive
- **Loose Coupling**: Stations don't need to know about each other
- **Extensibility**: Easy to add new listeners without modifying emitters
- **Separation of Concerns**: State management separate from UI updates
- **Reactive Updates**: UI automatically updates when state changes

### Negative
- **Event Ordering**: No guarantee of listener execution order
- **Debugging**: Harder to trace event flow through the system
- **Memory Leaks**: Must remember to unsubscribe (mitigated by station lifecycle)
- **No Type Safety**: Events are string-based, no compile-time checking

### Mitigations
- Stations clean up listeners in `destroy()` method
- Use descriptive event names and consistent payload structures
- Document event contracts in architecture guide
