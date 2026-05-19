# Agent guide — Dino Runner (StarterApp)

This file orients **Cursor and other coding agents** on how to run, test, and navigate this repository. For human-facing product docs, start with [README.md](README.md).

## What this project is

A **static web** Chrome-style dinosaur runner: HTML5 Canvas, vanilla JavaScript (ES modules), synthwave UI. No backend, no framework. Game logic lives under `js/`; pure helpers in `js/gameUtils.js` are unit-tested with Vitest in Node (no browser required for those tests).

## Run the application

**Preferred** — local static server (ES modules work reliably):

```bash
cd /path/to/StarterApp
npm install
npm run start
```

Open **http://localhost:5173**. `npm run start` runs `prestart`, which rebuilds `js/game.bundle.js` via esbuild.

**Cursor / VS Code:** Press **F5** and choose **Workshop App (Edge)** or **Workshop App (Chrome)** (see [.vscode/launch.json](.vscode/launch.json)). This runs `npm run start` and opens the browser when the server is ready.

**`file://` (optional):** Double-clicking [index.html](index.html) loads `js/game.bundle.js` instead of ES modules. If you change `js/` and rely on `file://`, run `npm run build`. Missing bundle shows the “Open via a local server” overlay.

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| CORS / blocked `main.js` / `file://` origin `null` | Opened without HTTP server | `npm run start` → http://localhost:5173 |
| Game unchanged after edits on `file://` | Stale bundle | `npm run build` or `npm run start` |
| Port in use | `serve` bound to 5173 | Change port in `package.json` `scripts.start` |

Full troubleshooting: [docs/gettingstarted.md](docs/gettingstarted.md).

## Run tests

Use a **single non-watch pass** for agents and CI (clear exit code):

```bash
npm install
npm test
```

`npm test` runs `vitest run` once. Local watch mode: `npm run test:watch`.

Tests live in `tests/` and import **`js/gameUtils.js`** (collision, scoring, difficulty). Canvas/game loop code is not covered by unit tests today.

## Documentation map

Read these before large changes; extend them when behavior or conventions change.

| Document | Purpose |
| --- | --- |
| [README.md](README.md) | Product overview, controls, difficulty, run/test commands, layout table |
| [docs/gettingstarted.md](docs/gettingstarted.md) | Server vs `file://`, F5 launch, tests, troubleshooting |
| [docs/architecture.md](docs/architecture.md) | Module roles, game loop, data flow, extension ideas |
| [docs/styleguide.md](docs/styleguide.md) | HTML/CSS/JS conventions, canvas emoji facing |
| [.cursor/rules/javascript-no-var.mdc](.cursor/rules/javascript-no-var.mdc) | Use `const` / `let`, never `var` in `**/*.{js,mjs,cjs}` |
| [.cursor/agents/game-designer.md](.cursor/agents/game-designer.md) | Subagent: level/mechanic design and tuning (design-first; implement only when asked) |
| [.cursor/skills/create-docs/SKILL.md](.cursor/skills/create-docs/SKILL.md) | How to write/update README and `docs/` |
| [.cursor/plans/dino_runner_game_92ae272f.plan.md](.cursor/plans/dino_runner_game_92ae272f.plan.md) | Original implementation plan (historical context) |

## Repository structure

```
StarterApp/
├── index.html          # Page shell; loads main.js (http) or game.bundle.js (file://)
├── css/styles.css      # Synthwave UI, design tokens on :root
├── js/
│   ├── main.js         # DOM wiring, starts Game
│   ├── game.js         # Loop, state machine, spawn/collision/score
│   ├── entities.js     # Dino, obstacles, background drawing
│   ├── input.js        # Keyboard (and game-shell focus for click)
│   ├── gameUtils.js    # Pure helpers — preferred home for testable logic
│   └── game.bundle.js  # esbuild output for file:// (regenerated; do not hand-edit)
├── tests/              # Vitest (*.test.js)
├── docs/               # Architecture, style, getting started
├── .cursor/            # Rules, agents, skills, plans
├── .vscode/            # F5 launch configs, recommended extensions
├── package.json        # scripts: build, start, test
└── vitest.config.js
```

### Module responsibilities

| Module | Change when you need to… |
| --- | --- |
| `js/main.js` | Wire new DOM elements, init hooks |
| `js/game.js` | States (`idle` / `running` / `gameOver`), loop, spawning, difficulty application |
| `js/entities.js` | Sprites, physics visuals, background/grid, emoji flip |
| `js/input.js` | Key bindings, input edge cases |
| `js/gameUtils.js` | Collision math, score format, difficulty curves (add tests here) |
| `css/styles.css` | Overlays, HUD, tokens, BEM-ish classes |
| `index.html` | Structure, overlay copy, element IDs used by `main.js` |

### Game state flow

`idle` → (start input) → `running` → (collision) → `gameOver` → (restart) → `running`.

Score is **elapsed seconds** while running. Difficulty ramps scroll speed and spawn interval over time (constants and helpers in `game.js` / `gameUtils.js` — verify in source before documenting new numbers).

## Agent workflow tips

1. **Scope:** Prefer small, testable edits. Put new pure logic in `gameUtils.js` with Vitest coverage when behavior is non-trivial.
2. **Verify:** After logic changes, run `npm test`. After UI or loop changes, run `npm run start` and exercise start, jump, collision, restart.
3. **Conventions:** Match [docs/styleguide.md](docs/styleguide.md); respect [.cursor/rules/javascript-no-var.mdc](.cursor/rules/javascript-no-var.mdc) on JS files.
4. **Sprites:** Directional emoji may need horizontal flip — see [docs/styleguide.md#canvas-emoji-sprites](docs/styleguide.md#canvas-emoji-sprites) and `Dino.draw` in `js/entities.js`.
5. **Design-only tasks:** Use or invoke the **game-designer** agent ([.cursor/agents/game-designer.md](.cursor/agents/game-designer.md)) for pacing, tuning tables, and layout proposals without code unless implementation is requested.
6. **Docs:** If you change user-visible behavior or run steps, update README and the relevant `docs/` file; use the create-docs skill when the user asks for documentation.

## npm scripts

| Script | Command | Use |
| --- | --- | --- |
| `start` | `serve . --listen 5173` (after `build`) | Local play and agent browser checks |
| `build` | esbuild bundle `main.js` → `game.bundle.js` | `file://` and `prestart` |
| `test` | `vitest run` | CI and agent verification |
| `test:watch` | `vitest` | Local development only |

## What this repo does not include

- No bundler required for **http** development (native ES modules).
- No API server, database, or auth.
- No E2E browser test suite (manual or MCP browser checks for full-game flows).

When requirements exceed this stack, say so in your plan and avoid pulling in heavy tooling unless the user asks.
