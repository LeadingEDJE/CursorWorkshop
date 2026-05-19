# Getting started

## Run the game (recommended)

Browsers **block ES modules** when you open HTML from disk (`file:///...`). That shows CORS errors in the console and the game will not start if only `main.js` is loaded.

Use a local server:

```bash
cd /path/to/StarterApp
npm install
npm run start
```

Open **http://localhost:5173** in Chrome, Edge, or Firefox.

Press **Space**, **↑**, or **click** to start and jump.

## Cursor / VS Code (F5)

After `npm install`, open the **Run and Debug** view, pick **Workshop App (Edge)** or **Workshop App (Chrome)** from the launch configuration dropdown, then press **F5** (debug) or **Ctrl+F5** (run without debugging). This runs `npm run start`, waits until the static server is ready, opens your browser, and stops the server when you stop the session.

## Open `index.html` from disk (optional)

Double-clicking `index.html` uses `js/game.bundle.js` (a single bundled script) instead of ES modules. That works without a server **if the bundle file is present**.

If you edit files under `js/`, rebuild the bundle:

```bash
npm run build
```

If the bundle is missing, the page shows instructions to run `npm run start` instead.

## Run tests (NPM required)

Tests are **not** required to play, but they are useful for workshop exercises and refactors.

### Run tests once (no watch)

Use this for **agents**, **CI**, or any time you need a single pass and a clear exit code (pass = `0`, fail = non-zero):

```bash
cd /path/to/StarterApp
npm install
npm test
```

`npm test` runs **`vitest run`**: the full suite executes **once** and the process **stops**; it does **not** watch files. The Vitest CLI output appears in the terminal.

### Watch mode (local development)

```bash
npm run test:watch
```

### Recommended editor extensions

This workspace lists optional extensions in [`.vscode/extensions.json`](../.vscode/extensions.json): **Vitest** (`vitest.explorer`) for the Testing sidebar and in-editor runs, and **Live Server** (`ritwickdey.LiveServer`) if you prefer that workflow for static preview (use `npm run start` or F5 for the same result with the bundled rebuild step).

## Troubleshooting

### Console: CORS / blocked `main.js` / `file://` origin `null`

You opened the project as a file URL and the browser refused to load ES modules. Use **`npm run start`** and open **http://localhost:5173**, or press **F5** with the Workshop App launch config. If you must use `file://`, ensure `js/game.bundle.js` exists (`npm run build`).

### `fetch()` to an API fails with CORS errors

Browsers enforce CORS for webby origins. For workshop spikes, prefer:

- a local static server + an API that allows localhost, or
- a tiny local proxy (outside the scope of this starter), or
- mock data in JavaScript for UI-first work.

### Port already in use

If `npm run start` fails because the port is taken, change the port in [`package.json`](../package.json) `scripts.start` flags for `serve`.
