---
name: Weapons system performance remediation
overview: "Remediate the critical and suggested performance issues in the weapons system: O(1) ship lookup in state, weapons station cleanup and conditional DOM updates, simulation allocation reduction, renderer config caching, and moving explosion updates into the simulation loop."
todos: []
isProject: false
---

# Weapons System Performance Remediation

## Approach

Address **critical** items first (state lookup, weapons cleanup, target-info/ordnance DOM), then **suggestions** (simulation allocations, renderer config, explosion loop). Optional items (DOM batching, profiling) are left as follow-up.

## 1. O(1) ship lookup in state ([js/core/state.js](js/core/state.js))

- Add a `shipsById` Map in `GameState`, maintained alongside `ships`.
- In `reset()`: set `this.shipsById = new Map()` (player is not in `ships`, so do not add player to the Map).
- In `addShip()`: after `this.ships.push(ship)`, add `this.shipsById.set(ship.id, ship)`.
- In `removeShip()`: after finding the ship, call `this.shipsById.delete(shipId)` before or after splicing from `ships`.
- In `getShip(shipId)`: if `shipId === 'player'` return `this.playerShip`; otherwise return `this.shipsById.get(shipId)` (or `undefined`). Remove the `this.ships.find(...)` call.

No other files need changes: all callers use `getShip(id)` or iterate `gameState.ships`; no code relies on `getShip` being linear or on array order.

## 2. Weapons station cleanup ([js/stations/weapons.js](js/stations/weapons.js))

- **Store bound handlers** so they can be removed in `destroy()`. In `setupEventListeners()`, assign bound methods to instance properties (e.g. `this._handlePhaserClick`, `this._handleFireOrdnance`, `this._handleTargetChange`, `this._handleShipDestroyed`, `this._handleCanvasClick`, and one handler per weapon-type button or a single delegated handler). Attach these same references to the DOM and to `gameState.on(...)`.
- In `destroy()`:
  - Remove DOM listeners from elements reached via `this.container` or `document.getElementById` (elements still exist when `destroy()` runs before the next station’s `init()`). Use the stored handler references.
  - Call `gameState.off('targetChanged', this._handleTargetChange)` and `gameState.off('shipDestroyed', this._handleShipDestroyed)`.
  - Set `this.container = null` and `this.canvas = null` to avoid retaining DOM references.

Follows the station-rules requirement: *"destroy(): Cleanup when station is switched away. Remove listeners..."*.

## 3. Conditional target info and ordnance updates ([js/stations/weapons.js](js/stations/weapons.js))

- **updateTargetInfo()**: Track last-rendered values (e.g. `this._lastTargetId`, `this._lastTargetDist`, `this._lastTargetBearing`, `this._lastPhaserInRange`, `this._lastTorpedoInRange`). At the start of `updateTargetInfo()`, get current target and compute current distance/bearing/range flags; if they match the last values, return without touching the DOM. Otherwise set `innerHTML` and update the cached values. Initialize the cached state in `render()` or first run so the first paint is correct.
- **updateOrdnanceDisplay()**: Only call when something relevant changes. Options:
  - Call it from `update()` only when phaser charge, any cooldown, or ammo counts have changed (compare to previous frame’s values stored on the instance), and always call it from `fireOrdnance()` and from the weapon-type button handler. Or
  - Throttle: call at most every N ms (e.g. 100) using `timestamp` in `update()`, and still call immediately after fire and type change.

Remove the unconditional `updateTargetInfo()` and `updateOrdnanceDisplay()` from the end of `update()` and replace with the conditional/throttled logic above.

## 4. Simulation: avoid per-projectile array allocation ([js/core/simulation.js](js/core/simulation.js))

- In `updateProjectiles()`, for **proximity checks** (nukes): instead of `shipsToCheck = proj.sourceId === 'player' ? gameState.ships : [...gameState.ships.filter(...), gameState.playerShip]`, iterate in place: e.g. loop over `gameState.ships` and skip `s.id === proj.sourceId`; then if `proj.sourceId !== 'player'`, also check distance to `gameState.playerShip`. No new array.
- For **direct collision targets**: instead of `targets = proj.sourceId === 'player' ? gameState.ships : [gameState.playerShip]`, use a simple loop: if player source, iterate `gameState.ships`; else check only `gameState.playerShip`. Avoid creating a new array every tick per projectile.

## 5. Renderer: cache torpedo config ([js/core/renderer.js](js/core/renderer.js))

- In [renderer.js](js/core/renderer.js), define a module-level or instance-level constant (e.g. `TORPEDO_DRAW_CONFIG`) mapping type to `{ color, trail, glow, trailLen }` (same values as the current inline object). In `drawTorpedo()`, use `const cfg = TORPEDO_DRAW_CONFIG[projectile.type] || TORPEDO_DRAW_CONFIG.torpedo` and remove the per-call object creation.

## 6. Explosion updates in simulation ([js/core/simulation.js](js/core/simulation.js) and [js/core/renderer.js](js/core/renderer.js))

- Add `updateExplosions()` in [simulation.js](js/core/simulation.js): decrement `gameState.explosions[i].lifetime`, splice when `lifetime <= 0`. Call it from the fixed timestep `update()` (e.g. after `updatePhaserBeams()`).
- In [renderer.js](js/core/renderer.js), inside `renderMap()`, remove the loop that decrements `gameState.explosions[i].lifetime` and splices. Keep only the loop that draws explosions (using current `explosion.lifetime` and `drawExplosion`). This keeps rendering read-only with respect to game state and ties explosion lifetime to simulation tick rate.

## Dependency order

- **1 (state Map)** can be done first and is independent.
- **2 (weapons destroy)** is independent.
- **3 (conditional target/ordnance)** only touches weapons.js.
- **4 (simulation arrays)** only touches simulation.js.
- **5 (renderer config)** only touches renderer.js.
- **6 (explosions)** touches simulation and renderer; do after 5 if desired.

Recommended implementation order: 1, 2, 3, 5, 6, 4 (or 4 before 6). After implementation, run the app and quick manual test: switch stations repeatedly, fire weapons, spawn many projectiles, and confirm no regressions and that explosions still animate correctly.
