# Getting started

## Run the app (no NPM required)

1. Open [`index.html`](../index.html) in your browser.
   - Windows: double-click `index.html`, or drag it into Chrome/Edge/Firefox.
   - macOS: right-click → Open With → your browser.

You should see the starter page with two small demos (greeting + counter).

## Cursor / VS Code (F5)

After `npm install`, open the **Run and Debug** view, pick **Workshop App (Edge)** or **Workshop App (Chrome)** from the launch configuration dropdown, then press **F5** (debug) or **Ctrl+F5** (run without debugging). This runs `npm run start`, waits until the static server is ready, opens your browser, and stops the server when you stop the session.

## Optional: run a local static server (NPM)

Some teams prefer `http://localhost` for demos, screenshots, or future `fetch()` work.

1. Install dependencies:

```bash
npm install
```

2. Start the static server:

```bash
npm run start
```

3. Open the URL printed in the terminal (defaults to a local port on `127.0.0.1`).

## Run tests (NPM required)

Tests are **not** required to use the app, but they are useful for workshop exercises and refactors.

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

This workspace lists optional extensions in [`.vscode/extensions.json`](../.vscode/extensions.json): **Vitest** (`vitest.explorer`) for the Testing sidebar and in-editor runs, and **Live Server** (`ritwickdey.LiveServer`) if you prefer that workflow for static preview (the repo also supports `npm run start` and opening `index.html` directly).

## Troubleshooting

### ES modules from `file://` fail in a browser

Use the local server path above (`npm run start`). This is the most common fix if a browser blocks module loading from disk URLs.

### `fetch()` to an API fails with CORS errors

Browsers enforce CORS for webby origins. For workshop spikes, prefer:

- a local static server + an API that allows localhost, or
- a tiny local proxy (outside the scope of this starter), or
- mock data in JavaScript for UI-first work.

### Port already in use

If `npm run start` fails because the port is taken, change the port in [`package.json`](../package.json) `scripts.start` flags for `serve`.
