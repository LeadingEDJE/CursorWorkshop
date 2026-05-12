# Workshop starter app (HTML / CSS / JavaScript)

This is a minimal **static** starter used in Leading EDJE workshops focused on **agentic AI development**. Teams decide what to build; this repo only provides scaffolding, sample interactions, and documentation hooks.

## Run it

You can run the application **without installing anything**:

- Open [`index.html`](index.html) in a modern browser.

Optional local server and automated tests use NPM—see [Getting started](docs/gettingstarted.md).

Cursor and VS Code may prompt you to install [recommended workspace extensions](.vscode/extensions.json) (Vitest test runner UI, Live Server for static preview). These extensions are optional but may enhance your experience running or testing the application.

## Run tests once (agents and CI)

From the repository root, install dependencies if needed, then run the test script **once** (no watch, process exits with a non-zero code on failure):

```bash
npm install
npm test
```

`npm test` maps to `vitest run` in [`package.json`](package.json). For watch mode while developing, use `npm run test:watch` instead. More detail: [Getting started — Run tests once](docs/gettingstarted.md#run-tests-once-no-watch).

## Documentation

- [Architecture](docs/architecture.md): how the static files fit together and where to extend.
- [Style guide](docs/styleguide.md): HTML/CSS/JS conventions used in the starter.
- [Getting started](docs/gettingstarted.md): `file://` vs local server, tests, troubleshooting.

## Repository layout

- `index.html` — page shell
- `css/` — stylesheets
- `js/` — ES modules
- `docs/` — workshop documentation
- `tests/` — Vitest tests (requires `npm install`)

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run start` | Serves the folder over HTTP (optional; not required to use the app) |
| `npm test` | Runs unit tests in Node |
| `npm run test:watch` | Runs tests in watch mode |
