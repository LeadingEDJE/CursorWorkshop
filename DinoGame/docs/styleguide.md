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

This project uses **BEM-ish** naming for UI components (for example `.overlay__panel`, `.score-display__value`). Stay consistent within the stylesheet you are editing.

### Accessibility

- Ensure interactive elements show a visible focus style (`:focus-visible` is set globally).
- If you add custom colors, check contrast in both light and dark modes (this starter supports `prefers-color-scheme`).

## JavaScript

### Modules

- The browser entry is [`js/main.js`](../js/main.js), loaded as `<script type="module">`.
- Put reusable logic in separate modules (see [`js/gameUtils.js`](../js/gameUtils.js) for testable pure helpers).

### DOM access

- Keep DOM queries close to initialization. If the file grows, consider small functions like `function $(id) { ... }` or `querySelector` helpers—avoid repeating long selectors everywhere.

### Errors

- For workshop demos, fail loudly in development (throwing on missing DOM nodes is acceptable). If you ship something more user-facing, replace with graceful UI error states.

## Canvas emoji sprites

This game draws characters with `fillText` and emoji glyphs on the canvas (see [`js/entities.js`](../js/entities.js)). Emoji are convenient sprites, but **their default facing is not guaranteed to match your game’s motion**.

### Face sprites toward the run direction

In a side-scroller, the player runs **to the right** while the world scrolls left. Sprites should **look like they are moving in that direction**. If a glyph faces the wrong way, the scene feels broken even when physics and controls are correct.

| Sprite | Default facing (typical) | Action in this project |
| --- | --- | --- |
| 🦖 Dinosaur | Left | **Flip horizontally** so it faces right |
| 🌵 Cactus | No clear direction | Draw as-is |
| 🦅 Bird | Varies by font | Draw as-is (approaches from the right; no flip today) |

**Decision** — Flip the dino with `ctx.scale(-1, 1)` around its draw anchor. **Why** — `🦖` renders facing left in common system fonts; mirroring is simpler than swapping emoji or adding image assets.

When you add a new directional emoji (runner, vehicle, creature), **check how it renders on your target platforms** before shipping. If it faces left, apply the same horizontal flip in `draw()`. If it already faces right, do not flip (double-flipping looks wrong).

### How to flip without shifting position

Translate to the right edge of the sprite, scale X by `-1`, then draw at the origin:

```javascript
ctx.save();
ctx.font = `${DINO_FONT_SIZE}px serif`;
ctx.textBaseline = "bottom";
ctx.translate(drawX + DINO_FONT_SIZE, drawY);
ctx.scale(-1, 1);
ctx.fillText(DINO_EMOJI, 0, 0);
ctx.restore();
```

Adjust `drawX` / `DINO_FONT_SIZE` if the mirrored glyph looks offset; emoji metrics differ slightly between browsers and OSes.

## Copy and tone

Workshop apps vary. Keep user-facing text short, specific, and testable (users should always know what a button will do).
