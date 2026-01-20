# WarpMe Architecture Guide

This document describes the system architecture, code organization, and key design decisions in the WarpMe Starship Simulator.

## Overview

WarpMe is a single-page application (SPA) built with vanilla JavaScript ES modules. It uses a central state management pattern with event-driven updates to keep all UI components synchronized.

```
┌─────────────────────────────────────────────────────────────────┐
│                         index.html                               │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │   Top Nav   │  │              Tab Navigation              │  │
│  └─────────────┘  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Active Station Panel                  │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐  │   │
│  │  │    Controls     │  │       Canvas Viewport        │  │   │
│  │  └─────────────────┘  └─────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Modules

### State Management (`js/core/state.js`)

The central nervous system of the application. All game data lives here.

```javascript
// Singleton pattern - one instance shared everywhere
export const gameState = new GameState();
```

**Key Responsibilities:**
- Player ship data (position, heading, velocity, subsystems)
- NPC ship collection
- Projectiles and visual effects
- Communications log
- Alert level and waypoints

**Event System:**
```javascript
// Subscribe to state changes
gameState.on('shipDamaged', (data) => {
    updateHealthDisplay(data.ship);
});

// Emit events when state changes
gameState.emit('shipDamaged', { ship, damage });
```

**Data Factories:**
```javascript
createShip(config)      // Creates a new ship object
createProjectile(config) // Creates torpedo/phaser projectile
createSubsystems()       // Creates default subsystem state
```

### Simulation Engine (`js/core/simulation.js`)

The game loop that drives all movement and AI.

**Fixed Timestep Pattern:**
```javascript
// 20Hz update rate (50ms per tick)
this.tickLength = 50;

// In the loop:
for (let i = 0; i < ticksNeeded; i++) {
    this.update(); // Fixed rate updates
}
this.onRender(timestamp); // Variable rate rendering
```

**Update Phases:**
1. `updatePlayerShip()` - Apply velocity, check waypoints
2. `updateNPCShips()` - Run AI state machines, apply movement
3. `updateProjectiles()` - Move projectiles, check collisions
4. `updatePhaserBeams()` - Decay visual effects
5. `updateRepairCooldowns()` - Tick down repair timers
6. `checkAlertLevel()` - Auto-escalate based on hostile proximity
7. `regenerateShields()` - Slow shield regeneration

### NPC AI State Machine

```
                    ┌─────────────┐
                    │   PATROL    │
                    └──────┬──────┘
                           │ player nearby
                           ▼
                    ┌─────────────┐
         damaged    │  APPROACH   │
         ◄──────────┤             │
         │          └──────┬──────┘
         │                 │ in range
         ▼                 ▼
  ┌─────────────┐   ┌─────────────┐
  │    FLEE     │   │   ATTACK    │
  └─────────────┘   └─────────────┘
```

**Faction Behaviors:**
- **Friendly:** Patrol near player, escort behavior
- **Neutral:** Patrol trade routes, ignore player
- **Hostile:** Attack when close, flee when damaged

### Renderer (`js/core/renderer.js`)

Canvas-based 2D rendering with world-to-screen coordinate transformation.

**Coordinate System:**
```javascript
// World coordinates (game space)
ship.x, ship.y  // Can be any value

// Screen coordinates (canvas pixels)
worldToScreen(worldX, worldY, centerX, centerY, scale)
screenToWorld(screenX, screenY, centerX, centerY, scale)
```

**Rendering Layers:**
1. Stars (parallax background)
2. Grid lines
3. Radar sweep (tactical only)
4. Scan rings
5. Waypoint marker
6. Phaser beams
7. Torpedoes
8. NPC ships
9. Player ship
10. HUD overlay

**Zoom/Scale:**
- `scale = 1` → 1:1 world units to pixels
- `scale = 3` → zoomed out 3x (tactical view)
- `scale = 0.8` → zoomed in (helm view)

### Audio System (`js/core/audio.js`)

Procedural audio using Web Audio API oscillators.

**Initialization Pattern:**
```javascript
// Must be triggered by user interaction
document.addEventListener('click', () => audio.init(), { once: true });
```

**Sound Generation:**
```javascript
playTone(frequency, duration, type, volume)
playSweep(startFreq, endFreq, duration, type, volume)
createNoise(duration, volume)  // For explosions
```

**Available Sounds:**
| Method | Use |
|--------|-----|
| `playClick()` | UI button press |
| `playScan()` | Sensor ping |
| `playPhaser()` | Phaser fire |
| `playTorpedo()` | Torpedo launch |
| `playExplosion()` | Ship destruction |
| `playHail()` | Incoming transmission |
| `playRedAlert()` | Red alert klaxon |

## Station Modules

Each station follows the same interface:

```javascript
class XxxStation {
    init(container)    // Set up DOM and event listeners
    render()           // Generate HTML content
    update(timestamp)  // Called every frame
    destroy()          // Cleanup when switching away
}
```

### Station Communication Flow

```
User Input → Station Module → GameState → Event Emitted
                                              │
              ┌───────────────────────────────┤
              ▼                               ▼
        Other Stations              Simulation Engine
        (via event listeners)       (updates game world)
```

### Station-Specific Notes

**Tactical (`tactical.js`):**
- Manages its own canvas via renderer singleton
- Tracks scan animation state locally
- Maintains selected ship reference

**Weapons (`weapons.js`):**
- Local phaser charge and torpedo count
- Cooldown timers (frames, not milliseconds)
- Range checking for weapon availability

**Helm (`helm.js`):**
- Keyboard input handling (WASD/arrows)
- Throttle maps to velocity via engine effectiveness
- Compass needle rotation via CSS transform

**Navigation (`navigation.js`):**
- Pan/drag with mouse
- View offset separate from player position
- Click-to-set-waypoint on canvas

**Comms (`comms.js`):**
- Message filtering by type
- Simulated NPC responses via setTimeout
- Unread message tracking

**Engineering (`engineering.js`):**
- Power budget system (200% total)
- Preset configurations (combat, defensive, etc.)
- Repair cooldown management

## Data Flow Example

**Firing a Torpedo:**

```
1. User clicks "FIRE TORPEDO" button (weapons.js)
2. weaponsStation.fireTorpedo() called
3. gameState.fireWeapon('torpedo', targetId) called
4. Projectile created and added to gameState.projectiles
5. gameState.emit('weaponFired', { type: 'torpedo' })
6. audio.playTorpedo() triggered
7. Next simulation tick: projectile moves via simulation.updateProjectiles()
8. Collision detected: gameState.damageShip(target, damage)
9. gameState.emit('shipDamaged', { ship, damage })
10. If destroyed: gameState.removeShip(shipId)
11. gameState.emit('shipDestroyed', ship)
12. Tactical contact list updates via event listener
```

## File Dependencies

```
index.html
    └── js/main.js
            ├── js/core/state.js
            ├── js/core/simulation.js ─────────┐
            │       └── state.js, audio.js     │
            ├── js/core/audio.js               │
            ├── js/core/scenario.js            │
            │       └── state.js               │
            └── js/stations/*.js               │
                    └── state.js, renderer.js, audio.js
                            │
                            └── state.js ◄─────┘
```

## Key Design Decisions

### Why No Framework?
- Workshop demos benefit from readable, explicit code
- No build step = instant iteration
- Forces understanding of underlying patterns
- Smaller payload, faster load

### Why Singleton Instances?
- Simpler than dependency injection for this scale
- Easy to import and use anywhere
- Game state is naturally global

### Why Fixed Timestep?
- Physics/AI updates are deterministic
- Prevents fast machines from having faster ships
- Decouples game logic from frame rate

### Why Event-Driven Updates?
- Loose coupling between modules
- Stations don't need to know about each other
- Easy to add new listeners without modifying emitters

### Why Canvas Instead of SVG/DOM?
- Better performance for many moving objects
- Simpler coordinate transformations
- More game-like rendering patterns
- Easier to implement effects (glow, trails)

## Extending the System

### Adding a New Station

1. Create `js/stations/newstation.js`
2. Implement the station interface (init, render, update, destroy)
3. Import and register in `js/main.js`
4. Add tab button and panel in `index.html`

### Adding a New Ship Type

1. Update `createShip()` in `state.js` with type-specific defaults
2. Optionally add rendering variations in `renderer.js`

### Adding New Weapons

1. Add weapon logic in `gameState.fireWeapon()`
2. Create projectile type in `createProjectile()`
3. Handle collision in `simulation.updateProjectiles()`
4. Add sound effect in `audio.js`
5. Add UI controls in `weapons.js`

### Adding Multiplayer

The architecture is prepared for this:
1. Replace `gameState` singleton with network-synced state
2. Use BroadcastChannel API for local multi-tab
3. Use WebSocket for true multiplayer
4. Stations already communicate via events
