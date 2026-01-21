# ADR-002: Use Singleton Pattern for Core Modules

## Status
Accepted

## Context
The application requires shared access to core systems (game state, simulation engine, renderer, audio) from multiple station modules. We needed a simple way to provide global access without complex dependency injection.

Key considerations:
- Multiple stations need access to the same game state
- Core systems (simulation, renderer, audio) are naturally global
- Project scale doesn't justify complex DI container
- Need easy imports across the codebase

## Decision
We will use singleton pattern for core modules: `gameState`, `simulation`, `renderer`, and `audio`. Each module exports a single instance that is imported and used throughout the application.

Example:
```javascript
// In state.js
export const gameState = new GameState();

// In other modules
import { gameState } from './core/state.js';
```

## Consequences

### Positive
- **Simplicity**: Easy to import and use anywhere
- **Single Source of Truth**: One instance ensures consistent state
- **No Dependency Injection**: Reduces complexity for this project scale
- **Familiar Pattern**: Easy for developers to understand

### Negative
- **Testing Challenges**: Harder to mock or replace singletons in tests
- **Tight Coupling**: Modules directly depend on concrete implementations
- **Global State**: Can make it harder to reason about state changes
- **Not Scalable**: Would need refactoring for larger applications

### Mitigations
- Event-driven architecture helps decouple modules despite singleton usage
- Clear separation of concerns (state, simulation, rendering) limits coupling
- For future testing, could add factory functions that return instances
