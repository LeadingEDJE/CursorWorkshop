# Style guide

This is a lightweight guide for workshop teams. Prefer consistency over perfection.

## HTML

- Use semantic elements (`header`, `main`, `footer`, `section`, `nav`, `button`) instead of anonymous `div` soup when it helps readability.
- Every interactive control should have an accessible name: associate `label` with inputs, and use meaningful button text.
- Prefer stable `id` values only where JavaScript needs to query an element. Otherwise use classes.

## CSS

### Tokens

Design tokens live on `:root` in [`css/styles.css`](../css/styles.css) as CSS variables (for example `--space-3`, `--color-text`, `--radius`).

- Prefer **variables** over repeating raw colors/spacing values.
- Prefer **layout primitives** (`.card`, `.row`, `.field`) over one-off magic margins when possible.

### Naming

This starter uses **BEM-ish** naming for layout components (for example `.site-header__inner`). You may switch conventions as a team, but stay consistent within the stylesheet you are editing.

### Accessibility

- Ensure interactive elements show a visible focus style (`:focus-visible` is set globally).
- If you add custom colors, check contrast in both light and dark modes (this starter supports `prefers-color-scheme`).

## JavaScript

### Modules

- The browser entry is [`js/main.js`](../js/main.js), loaded as `<script type="module">`.
- Put reusable logic in separate modules (see [`js/appState.js`](../js/appState.js)).

### DOM access

- Keep DOM queries close to initialization. If the file grows, consider small functions like `function $(id) { ... }` or `querySelector` helpers—avoid repeating long selectors everywhere.

### Errors

- For workshop demos, fail loudly in development (throwing on missing DOM nodes is acceptable). If you ship something more user-facing, replace with graceful UI error states.

## Copy and tone

Workshop apps vary. Keep user-facing text short, specific, and testable (users should always know what a button will do).
