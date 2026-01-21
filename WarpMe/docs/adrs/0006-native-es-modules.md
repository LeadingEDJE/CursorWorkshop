# ADR-006: Use Native ES Modules Without Build Step

## Status
Accepted

## Context
The project needed a module system for code organization but wanted to avoid build tooling complexity. Modern browsers support ES modules natively.

Key considerations:
- Need code organization and module boundaries
- Want to avoid build step for faster iteration
- Modern browsers support ES modules
- Educational value of using native browser features

## Decision
We will use native ES6 modules with `import`/`export` statements, served directly to the browser without transpilation or bundling.

Implementation:
- All JavaScript files use ES module syntax
- `index.html` includes main module with `type="module"`
- Modules import/export using standard ES6 syntax
- Must be served over HTTP (not `file://` protocol)

## Consequences

### Positive
- **No Build Step**: Instant iteration, no compilation wait
- **Native Support**: Modern browsers handle modules natively
- **Clear Dependencies**: Import statements show module dependencies
- **Code Splitting**: Natural code organization by module
- **Educational**: Demonstrates modern JavaScript module system

### Negative
- **HTTP Required**: Can't open HTML file directly (must use server)
- **Browser Support**: Requires modern browsers (IE11 not supported)
- **No Bundling**: Can't optimize bundle size or tree-shake
- **Multiple Requests**: Browser makes separate requests for each module

### Mitigations
- Document server requirement in README
- Provide multiple server options (Python, Node.js, VS Code extensions)
- Modern browser requirement is acceptable for this project
- HTTP/2 makes multiple requests less of a concern
