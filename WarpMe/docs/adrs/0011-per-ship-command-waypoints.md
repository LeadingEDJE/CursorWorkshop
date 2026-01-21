# ADR-0011: Per-Ship Command Waypoints for Fleet Coordination

## Status
Accepted

## Context
The comms station was originally a passive message-based interface that felt "pointless" to players. We wanted to transform it into an active fleet command center where players could coordinate friendly ships.

Key requirements:
- Players need to assign individual waypoints to specific friendly ships
- Friendly ships should navigate to assigned waypoints
- Ships should resume normal behavior after reaching waypoints
- Visual feedback needed for ship selection and waypoint assignment
- Only friendly ships should be controllable

Design constraints:
- Existing waypoint system only supported a single global waypoint for the player ship
- AI system needed to prioritize command waypoints over normal behavior
- Rendering system needed to display multiple waypoints simultaneously
- UI needed to support ship selection and waypoint assignment

## Decision
We will implement a per-ship command waypoint system that allows players to assign individual waypoints to friendly ships through the comms station.

### Implementation Details

**State Management:**
- Add `commandWaypoint: { x, y } | null` property to ship data structure
- Add `setShipWaypoint(shipId, x, y)` method to GameState
- Add `clearShipWaypoint(shipId)` method to GameState
- Emit `shipWaypointSet` and `shipWaypointCleared` events

**AI Behavior:**
- Command waypoints take priority over normal AI behavior for friendly ships
- When `commandWaypoint` exists, friendly ships enter `followWaypoint` AI state
- Ships navigate toward waypoint at 70% max velocity
- When ship arrives (within 30 units), waypoint is automatically cleared
- After clearing, ship resumes normal patrol/approach behavior on next tick

**Comms Station Redesign:**
- Transform from message-only interface to tactical fleet command center
- Add interactive canvas map showing all ships
- Implement ship selection via click (visual selection ring)
- Click on map to assign waypoint to selected friendly ship
- Display fleet list with waypoint indicators
- Show selected ship details and waypoint information

**Rendering:**
- Add `drawShipWaypoint()` - waypoint marker with ship color
- Add `drawShipWaypointLine()` - dashed line from ship to waypoint
- Add `drawSelectionRing()` - animated selection indicator
- Support `selectedShipId` and `showShipWaypoints` options in `renderMap()`

**Tactical Station Integration:**
- Display friendly ship waypoints on tactical screen for situational awareness
- Waypoints visible as markers with connecting lines to ships

## Consequences

### Positive
- **Active Gameplay**: Comms station becomes engaging fleet command interface
- **Tactical Control**: Players can coordinate multiple friendly ships independently
- **Clear Visual Feedback**: Selection rings, waypoint markers, and lines make state clear
- **Automatic Cleanup**: Ships resume normal behavior without manual intervention
- **Priority System**: Command waypoints naturally override normal AI when present
- **Extensible**: System can support additional command types in future
- **Situational Awareness**: Waypoints visible on tactical screen help coordinate fleet movements

### Negative
- **State Complexity**: Each ship now has additional waypoint state
- **AI Coupling**: Friendly ship AI now depends on command waypoint property
- **Rendering Overhead**: Multiple waypoints and lines add to render complexity
- **UI Complexity**: Comms station now has map interaction, selection, and waypoint assignment
- **Potential Confusion**: Players might not understand why ships stop following waypoints

### Mitigations
- Clear visual indicators (waypoint markers, lines) show active commands
- Automatic waypoint clearing with comms message ("Waypoint reached. Resuming patrol.")
- Only friendly ships can receive waypoints (prevents confusion)
- Selection ring makes it clear which ship is selected
- Fleet list shows which ships have active waypoints
- Waypoints visible on tactical screen for cross-station awareness
- Well-documented in code comments and ADR

## Related Decisions
- ADR-0009: Centralized state management enables per-ship waypoint storage
- ADR-0004: Event-driven architecture allows reactive UI updates on waypoint changes
- ADR-0008: Standardized station interface pattern maintained in comms redesign
