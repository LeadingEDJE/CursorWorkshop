# Dino Runner

A **Chrome-style dinosaur runner** — a side-scrolling endless runner where you jump over obstacles and try to survive as long as possible. Built with plain **HTML, CSS, and JavaScript** (ES modules in `js/`, plus a bundled script for opening from disk).

The game uses a **synthwave** visual theme: dark purple/navy backgrounds, neon pink and cyan glow effects, a retro horizon grid, and emoji sprites for the dinosaur and obstacles.

## What you do

The dinosaur runs continuously to the right while the landscape scrolls left. Obstacles appear from the right — cacti on the ground and birds in the air. Your job is to **time your jumps** so you do not hit anything.

- **Score** = how many seconds you have survived, shown in the upper-right corner (e.g. `12.3s`).
- **Game over** = the dinosaur collides with any obstacle. Your final time is displayed; you can restart and try again.
- **Difficulty increases** the longer you survive: the world scrolls faster and obstacles spawn more often.

## Controls

| Input | Action |
| --- | --- |
| `Space` | Start game · Jump · Restart after game over |
| `↑` | Start game · Jump |
| `Enter` | Restart after game over |
| Left click (anywhere on the game) | Start · Jump · Restart (same as `Space`) |

You can also use **Play Again** on the game-over screen.

Jumping is only allowed while the dinosaur is on the ground (no double-jump).

## Game flow

1. **Start screen** — animated synthwave background with title and instructions. Press `Space` to begin.
2. **Running** — obstacles spawn at random intervals from the right edge. The score counts up in real time.
3. **Game over** — on collision, play stops and an overlay shows your final time. Press `Space`, `Enter`, or **Play Again** to restart.

## Obstacles

| Type | Sprite | Behavior |
| --- | --- | --- |
| Ground | 🌵 | Sits on the ground line; jump over it. |
| Air | 🦅 | Floats at mid-jump height; you must **not** jump at the wrong time (jump only when needed for ground obstacles, or time jumps to clear birds). |

Roughly **60%** of spawns are ground obstacles and **40%** are air obstacles.

## Difficulty scaling

Difficulty ramps automatically based on survival time:

| Mechanic | Behavior |
| --- | --- |
| Scroll speed | Starts at 300 px/s; increases by 10 px/s every 5 seconds, capped at 800 px/s. |
| Spawn rate | Obstacles spawn less frequently at first (~1.8 s apart); base interval shrinks by 110 ms every 6 seconds (desynced from scroll speed), down to a minimum of ~0.7 s. Between 20–40s, spawn jitter uses a tighter random floor to reduce back-to-back clusters. |

There is no separate “level” system — pressure comes entirely from speed and spawn frequency.

## Technical overview

- **Rendering**: HTML5 `<canvas>` at full viewport size, with device-pixel-ratio scaling for sharp graphics on HiDPI screens.
- **Physics**: simple gravity and jump velocity on the dinosaur; obstacles move left at the current scroll speed.
- **Collision**: axis-aligned bounding boxes (slightly inset from sprite bounds for fairer gameplay).
- **Emoji sprites**: the dino and obstacles are drawn as emoji on the canvas. Some glyphs face the wrong way for a right-running game — the dinosaur is **horizontally flipped** so it faces the run direction (see [Canvas emoji sprites](docs/styleguide.md#canvas-emoji-sprites)).
- **Architecture**: game loop and state in `js/game.js`; entities and drawing in `js/entities.js`; keyboard input in `js/input.js`; pure helpers (collision, scoring, difficulty curves) in `js/gameUtils.js` for easy unit testing.

See [Architecture](docs/architecture.md) for a module diagram and extension ideas.

## Run it

**Recommended** — local server (avoids browser `file://` restrictions on ES modules):

```bash
npm install
npm run start
```

Then open **http://localhost:5173** in your browser.

You can also double-click [`index.html`](index.html); it loads a pre-built `js/game.bundle.js` for `file://` URLs. If you change game code, run `npm run build` (or `npm run start`, which rebuilds automatically).

In Cursor / VS Code, press **F5** and choose **Workshop App (Edge)** or **Workshop App (Chrome)** — see [Getting started](docs/gettingstarted.md).

## Run tests

Pure game logic is covered by Vitest (no browser or canvas required for those tests):

```bash
npm install
npm test
```

## Repository layout

| Path | Purpose |
| --- | --- |
| `index.html` | Game page — canvas, score HUD, start/game-over overlays |
| `css/styles.css` | Synthwave UI (overlays, score, buttons) |
| `js/main.js` | Entry point — wires DOM and starts the game |
| `js/game.js` | Game loop, state machine, spawning, collision, scoring |
| `js/entities.js` | Dino, obstacles, background/grid rendering |
| `js/input.js` | Keyboard handling |
| `js/gameUtils.js` | Testable helpers (collision, score format, difficulty) |
| `tests/` | Vitest unit tests |
| `docs/` | Architecture, style guide (incl. emoji facing), getting started |

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run start` | Serves the folder over HTTP (optional) |
| `npm test` | Runs unit tests in Node |
| `npm run test:watch` | Runs tests in watch mode |
