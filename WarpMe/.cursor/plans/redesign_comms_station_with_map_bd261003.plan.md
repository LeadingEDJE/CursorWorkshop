---
name: Redesign Comms Station with Map
overview: Redesign the comms station to include an interactive map where players can click on friendly ships and set navigation waypoints for them. Friendly ships will navigate to their assigned waypoints, and waypoints will be visible on the comms station map.
todos:
  - id: add-ship-waypoint-state
    content: Add ship waypoint storage and management methods to state.js (setShipWaypoint, clearShipWaypoint, getShipWaypoint)
    status: pending
  - id: implement-npc-waypoint-navigation
    content: Modify simulation.js moveNPCShip() to navigate friendly ships to their waypoints
    status: pending
  - id: add-ship-waypoint-rendering
    content: Add renderer methods to draw ship waypoints and waypoint lines on the map
    status: pending
  - id: redesign-comms-station-ui
    content: Redesign comms.js layout to include map canvas and split view with comms log
    status: pending
  - id: implement-ship-selection
    content: Add ship selection logic in comms station (click on friendly ships)
    status: pending
  - id: implement-waypoint-setting
    content: Add waypoint setting logic (click map to set waypoint for selected ship)
    status: pending
  - id: add-comms-map-styling
    content: Add CSS styles for comms station map layout and selected ship indicators
    status: pending
---

# Redesign Comms Station with Map and Ship Waypoint Control

## Overview

Transform the comms station from a simple messaging interface into a tactical command center with an interactive map. Players can select friendly ships and assign them navigation waypoints, which the ships will navigate towards.

## Architecture Changes

### 1. Ship Waypoint System

- **File**: `WarpMe/js/core/state.js`
  - Add `waypoint` property to ship objects (currently only player ship has waypoint)
  - Add `setShipWaypoint(shipId, x, y)` method to set waypoint for a specific ship
  - Add `clearShipWaypoint(shipId)` method to clear a ship's waypoint
  - Add `getShipWaypoint(shipId)` method to retrieve a ship's waypoint
  - Track currently selected ship for waypoint assignment in comms station

### 2. NPC Ship Waypoint Navigation

- **File**: `WarpMe/js/core/simulation.js`
  - Modify `moveNPCShip()` function to check for ship-specific waypoints
  - When a friendly ship has a waypoint, prioritize navigating to it over patrol behavior
  - When waypoint is reached (within 20 units), clear the waypoint and resume patrol
  - Use similar navigation logic as player ship waypoint navigation

### 3. Comms Station Redesign

- **File**: `WarpMe/js/stations/comms.js`
  - Replace comms log panel with a split layout: map on left, comms log on right
  - Add canvas element for map rendering (similar to navigation station)
  - Implement map rendering using `renderer.renderMap()` with appropriate scale
  - Add ship selection on click (only friendly ships are selectable)
  - Add waypoint setting on map click (when ship is selected)
  - Display selected ship indicator and waypoint information
  - Show waypoints for all friendly ships on the map
  - Keep existing comms log functionality but in a smaller panel

### 4. Renderer Enhancements

- **File**: `WarpMe/js/core/renderer.js`
  - Add `drawShipWaypoint(ship, waypoint, centerX, centerY, scale)` method
  - Add `drawShipWaypointLine(ship, waypoint, centerX, centerY, scale)` method
  - Modify `renderMap()` to accept and render ship-specific waypoints
  - Add visual indicator for selected ship (different from target indicator)

### 5. CSS Updates

- **File**: `WarpMe/css/main.css`
  - Add styles for comms station map layout
  - Style selected ship indicator
  - Adjust comms log panel to fit in split layout
  - Ensure map canvas is properly sized and styled

## Implementation Details

### Ship Waypoint Storage

Ships will have an optional `waypoint` property:

```javascript
ship.waypoint = { x: 100, y: 200 } // or null
```

### Waypoint Assignment Flow

1. Player clicks on friendly ship on comms map → ship becomes selected
2. Player clicks on map location → waypoint set for selected ship
3. Previous ship's waypoint is cleared (only one ship can have waypoint)
4. Selected ship navigates to waypoint
5. When waypoint reached, ship resumes patrol behavior

### Visual Indicators

- Selected ship: Highlighted with distinct visual indicator (different from target)
- Ship waypoints: Displayed with waypoint marker and line from ship to waypoint
- Waypoint labels: Show ship name associated with waypoint

### State Management

- Add `selectedShipId` to comms station state (not global gameState)
- Emit events when ship waypoints are set/cleared for UI updates
- Update waypoint status display when waypoint is reached

## Files to Modify

1. `WarpMe/js/core/state.js` - Add ship waypoint methods
2. `WarpMe/js/core/simulation.js` - Add waypoint navigation for NPC ships
3. `WarpMe/js/stations/comms.js` - Complete redesign with map
4. `WarpMe/js/core/renderer.js` - Add ship waypoint rendering
5. `WarpMe/css/main.css` - Add comms map layout styles

## Testing Considerations

- Verify friendly ships navigate correctly to waypoints
- Ensure waypoint clears when reached
- Test ship selection and waypoint assignment
- Verify only one ship can have a waypoint at a time
- Ensure map rendering works correctly in comms station
- Test that existing comms functionality still works