# ADR-005: Use Canvas API for Rendering

## Status
Accepted

## Context
The game requires rendering many moving objects (ships, projectiles, effects) with smooth performance. We needed to choose between Canvas, SVG, or DOM-based rendering.

Key considerations:
- Need to render 10+ ships, projectiles, and visual effects simultaneously
- Requires smooth 60fps performance
- Need coordinate transformations (world-to-screen, zoom, pan)
- Want visual effects like glows, trails, and particle effects

## Decision
We will use HTML5 Canvas API for all game rendering instead of SVG or DOM elements.

Implementation:
- Single canvas element per station that needs rendering
- 2D rendering context for all graphics
- Custom rendering functions for ships, projectiles, effects
- World-to-screen coordinate transformation system
- Layered rendering (background → objects → HUD)

## Consequences

### Positive
- **Performance**: Excellent for many moving objects
- **Flexibility**: Easy to implement custom visual effects
- **Coordinate System**: Simple world-to-screen transformations
- **Game-Like Rendering**: Natural fit for game graphics patterns
- **Effects**: Easy to add glows, trails, and particle effects

### Negative
- **No DOM Integration**: Can't use CSS for styling game objects
- **Manual Rendering**: Must redraw everything every frame
- **No Built-in Interactivity**: Must manually handle hit detection
- **Accessibility**: Canvas content not automatically accessible to screen readers

### Mitigations
- Use CSS for UI elements (panels, buttons) outside canvas
- Implement custom hit detection for interactive elements
- Provide text-based alternatives for accessibility (contact lists, status displays)
- Use requestAnimationFrame for efficient rendering
