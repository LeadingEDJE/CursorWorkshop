# ADR-009: Centralize State in Single GameState Object

## Status
Accepted

## Context
The game has many pieces of state (player ship, NPC ships, projectiles, communications, alert level, waypoints, etc.) that need to be shared across multiple stations. We needed to decide between centralized or distributed state management.

Key considerations:
- Multiple stations need access to same game state
- State changes should be synchronized across all stations
- Need single source of truth for game data
- Want to avoid state duplication or inconsistency

## Decision
We will centralize all game state in a single `GameState` class instance that is shared across the entire application.

Implementation:
- `GameState` class holds all game data (ships, projectiles, comms, etc.)
- Exported as singleton: `export const gameState = new GameState()`
- State-changing methods on GameState (e.g., `addShip()`, `fireWeapon()`, `setAlertLevel()`)
- Event emission on state changes for reactive updates

## Consequences

### Positive
- **Single Source of Truth**: One place for all game state
- **Consistency**: No risk of state duplication or desynchronization
- **Easy Access**: All modules can import and use gameState
- **Centralized Logic**: State-changing operations in one place
- **Event Integration**: Natural fit with event-driven architecture

### Negative
- **Large Object**: GameState class becomes large with many responsibilities
- **Tight Coupling**: All modules depend on GameState structure
- **Testing**: Harder to test modules in isolation
- **Scalability**: May become unwieldy as game grows

### Mitigations
- Use factory functions for creating entities (ships, projectiles)
- Keep state structure well-documented
- Consider splitting into domain-specific state objects if it grows too large
- Use events to decouple modules from direct state access where possible
