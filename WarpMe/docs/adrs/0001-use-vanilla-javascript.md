# ADR-001: Use Vanilla JavaScript Instead of a Framework

## Status
Accepted

## Context
WarpMe is a starship bridge simulator designed for educational workshops and demonstrations. The project needed to balance functionality with readability and ease of understanding for developers learning JavaScript patterns.

Key considerations:
- Workshop participants need to understand the code without framework abstractions
- No build step allows for instant iteration and easier debugging
- Smaller payload size for faster loading
- Educational value of understanding underlying patterns

## Decision
We will use vanilla JavaScript (ES6+) with native ES modules instead of a framework like React, Vue, or Angular.

## Consequences

### Positive
- **Readability**: Code is explicit and doesn't require framework knowledge
- **No Build Step**: Instant iteration without transpilation or bundling
- **Smaller Bundle**: No framework overhead, faster load times
- **Educational**: Forces understanding of DOM manipulation, event handling, and state management patterns
- **Flexibility**: No framework constraints on architecture choices

### Negative
- **More Boilerplate**: Manual DOM manipulation instead of declarative templates
- **No Built-in State Management**: Must implement our own state management solution
- **No Component System**: Must manually manage component lifecycle
- **Browser Compatibility**: ES modules require modern browsers (acceptable trade-off)

### Mitigations
- Created standardized station interface pattern to reduce boilerplate
- Implemented centralized GameState singleton for state management
- Used event-driven architecture to reduce coupling between modules
