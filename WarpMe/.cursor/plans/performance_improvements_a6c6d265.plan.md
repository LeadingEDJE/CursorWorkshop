---
name: Performance Improvements
overview: Addresses the most impactful performance issues in the vanilla JS WarpMe starship simulator, focusing on listener accumulation, per-frame DOM bursting, and hot-path inefficiencies in the game loop and renderer.
todos:
  - id: fix-destroy-stubs
    content: Implement destroy() in all 6 station files to remove gameState.on() listeners and document-level event handlers
    status: pending
  - id: fix-renderer-resize-leak
    content: Fix renderer.js to store and reuse the resize handler reference so it can be properly removed
    status: pending
  - id: fix-comms-burst
    content: "Fix comms.js update() burst: replace timestamp modulo condition with a _lastFleetUpdate guard"
    status: pending
  - id: fix-engineering-burst
    content: "Fix engineering.js update() burst: replace timestamp modulo condition with a _lastRepairUpdate guard"
    status: pending
  - id: fix-helm-waypoint-dom
    content: Cache last waypoint HTML in helm.js update() and only set innerHTML when value changes
    status: pending
  - id: fix-draw-stars-date-now
    content: Hoist Date.now() outside the per-star loop in renderer.js drawStars()
    status: pending
  - id: fix-ship-colors-object
    content: Move the inline colors object in renderer.js drawShip() to a class-level constant
    status: pending
  - id: fix-explosion-in-renderer
    content: Move explosion lifetime decrement and removal from renderer.js into simulation.js update()
    status: pending
isProject: false
---

# Performance Improvements

## Summary

The app has several clear performance problems: listeners that pile up every time a station tab is visited, two separate DOM-rebuilding functions that burst at display refresh rate (~60 fps) instead of the intended periodic rate, and a handful of small but avoidable hot-path costs.

---

## Critical

### 1. `destroy()` is empty on all stations — listeners accumulate every tab switch

Every station (`helm.js`, `comms.js`, `navigation.js`, `tactical.js`, `weapons.js`, `engineering.js`) registers `gameState.on(...)` listeners and canvas/document event listeners in `init()`, but `destroy()` is a stub with a comment.

Switching tabs re-initializes the active station, stacking duplicate subscribers. One event (e.g. `commsMessage`) can eventually fire `updateCommsLog()` dozens of times per emission.

**Fix:** Give every station a `destroy()` that calls `gameState.off(...)` for each subscription, and `removeEventListener` for any `document`-scoped handlers (Helm's `keydown` and `pointerup`).

- Affects: all six station files

### 2. `renderer.init()` stacks `window.resize` listeners

`[renderer.js` line 25](WarpMe/js/core/renderer.js): `window.addEventListener('resize', () => this.resize())` — each call to `init()` passes a new arrow function, so the old one cannot be removed.

**Fix:** Store `this._resizeHandler = () => this.resize()` in the constructor, use it in `addEventListener`, and call `window.removeEventListener('resize', this._resizeHandler)` at the start of each `init()` call (or expose a `destroy()` for stations to call).

- File: `[WarpMe/js/core/renderer.js](WarpMe/js/core/renderer.js)`

### 3. Comms `updateFleetList()` bursts at ~60 fps for an entire second

`[comms.js` line 448](WarpMe/js/stations/comms.js):

```js
if (Math.floor(timestamp / 1000) % 5 === 0) {
    this.updateFleetList();
}
```

`timestamp` is in milliseconds; `Math.floor(timestamp / 1000)` gives the elapsed-seconds integer, which stays the same for all ~60 frames in that second. This means `updateFleetList()` (which rebuilds the entire fleet list DOM and re-attaches click listeners) fires up to 60 times per second, once per second. The intent was to run it once every 5 seconds.

**Fix:** Track a `_lastFleetUpdate` timestamp and guard with:

```js
if (timestamp - this._lastFleetUpdate > 5000) {
    this._lastFleetUpdate = timestamp;
    this.updateFleetList();
}
```

- File: `[WarpMe/js/stations/comms.js](WarpMe/js/stations/comms.js)`

### 4. Engineering `updateRepairButtons()` bursts at ~60 fps

`[engineering.js` line 317](WarpMe/js/stations/engineering.js):

```js
if (Math.floor(timestamp / 500) % 2 === 0) {
    this.updateRepairButtons();
}
```

Same bug — fires every frame within a ~500ms window (roughly 30 frames), twice a second, instead of twice a second.

**Fix:** Same pattern — use a `_lastRepairUpdate` timestamp guard:

```js
if (timestamp - this._lastRepairUpdate > 500) {
    this._lastRepairUpdate = timestamp;
    this.updateRepairButtons();
}
```

- File: `[WarpMe/js/stations/engineering.js](WarpMe/js/stations/engineering.js)`

---

## Suggestions

### 5. Helm `update()` rebuilds `waypointInfo.innerHTML` every frame

`[helm.js` line 360](WarpMe/js/stations/helm.js): `waypointInfo.innerHTML = this.getWaypointInfo()` runs every animation frame, even when the waypoint hasn't changed.

**Fix:** Cache the last rendered waypoint string and only assign `innerHTML` when it changes:

```js
const info = this.getWaypointInfo();
if (info !== this._lastWaypointInfo) {
    waypointInfo.innerHTML = info;
    this._lastWaypointInfo = info;
}
```

- File: `[WarpMe/js/stations/helm.js](WarpMe/js/stations/helm.js)`

### 6. `drawStars()` calls `Date.now()` inside a per-star loop

`[renderer.js` line 73](WarpMe/js/core/renderer.js): `const alpha = star.brightness * (0.8 + Math.sin(Date.now() / 1000 + star.x) * 0.2)` — `Date.now()` is called once per visible star per frame, creating unnecessary overhead.

**Fix:** Hoist the time call outside the loop:

```js
drawStars(centerX, centerY, scale) {
    const now = Date.now();
    this.stars.forEach(star => {
        // ...
        const alpha = star.brightness * (0.8 + Math.sin(now / 1000 + star.x) * 0.2);
```

- File: `[WarpMe/js/core/renderer.js](WarpMe/js/core/renderer.js)`

### 7. `drawShip()` creates an inline color object on every call

`[renderer.js` line 147](WarpMe/js/core/renderer.js): the `colors` object is created on every `drawShip()` invocation (called once per ship per frame).

**Fix:** Move it to a class-level constant or to the constructor as `this._shipColors`.

- File: `[WarpMe/js/core/renderer.js](WarpMe/js/core/renderer.js)`

### 8. `regenerateShields()` allocates a new array every simulation tick

`[simulation.js` line 443](WarpMe/js/core/simulation.js): `gameState.ships.concat([gameState.playerShip])` creates a throwaway array 20 times per second.

**Fix:** Use a `for...of` loop or iterate ships and player separately:

```js
for (const ship of [...gameState.ships, gameState.playerShip]) { ... }
// or just iterate twice
```

### 9. Explosion lifetime mutation inside renderer

`[renderer.js` lines 601-608](WarpMe/js/core/renderer.js): `gameState.explosions[i].lifetime--` and `.splice()` run inside `renderMap()`, mixing simulation state with rendering.

**Fix:** Move explosion lifetime decrement and removal into `simulation.js`'s `update()` method. The renderer should only read state, not mutate it.

---

## Optional / Follow-up

- **Engineering `update()` uses `document.querySelector` with a dynamic selector per system per frame** (`line 323`). Cache element references in `init()` instead.
- **Tactical station `performScan` `setInterval`** — verify it's always cleared if `destroy()` is called mid-scan (currently `destroy()` is a stub).
- `**drawTorpedo()` also calls `Date.now()` for nuke pulse** (`line 245`). Same fix as stars — hoist to top of `renderMap()` and pass as a parameter.
- Consider running DevTools Performance profiler while playing to confirm the top CPU consumers before doing deeper optimization work.

