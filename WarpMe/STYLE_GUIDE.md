# WarpMe Visual Style Guide

This document outlines the visual design system, CSS patterns, and UI conventions used in the WarpMe Starship Simulator.

## Design Philosophy

The interface draws inspiration from:
- **Star Trek LCARS** - Rounded panels, status bars, color-coded information
- **Modern Glassmorphism** - Translucent panels with backdrop blur
- **Sci-Fi HUDs** - Glowing elements, grid overlays, radar displays

The goal is a futuristic, readable interface that looks impressive while remaining functional.

## Color System

### Primary Palette

```css
--color-primary: #00f0ff;     /* Cyan - main accent, interactive elements */
--color-secondary: #ff9900;   /* Orange - secondary accent, torpedoes */
--color-tertiary: #cc99ff;    /* Purple - tertiary accent */
```

### Status Colors

```css
--color-success: #00ff88;     /* Green - positive states, healthy systems */
--color-warning: #ffcc00;     /* Yellow - caution states */
--color-danger: #ff3366;      /* Red/Pink - critical states, hostile */
--color-info: #66ccff;        /* Light blue - informational */
```

### Faction Colors

| Faction | Color | Hex | Use |
|---------|-------|-----|-----|
| Friendly | Green | `#00ff88` | Allied ships, healthy systems |
| Neutral | Yellow | `#ffcc00` | Civilian ships, warnings |
| Hostile | Red | `#ff3366` | Enemy ships, damage, alerts |

### Background Colors

```css
--bg-dark: #0a0a12;           /* Main background - near black */
--bg-panel: rgba(10, 20, 40, 0.85);     /* Panel background */
--bg-input: rgba(0, 20, 40, 0.8);       /* Input field background */
```

### Text Colors

```css
--text-primary: #e0f0ff;      /* Main text - off-white with blue tint */
--text-secondary: #88aacc;    /* Secondary text - muted blue */
--text-dim: #446688;          /* Disabled/placeholder text */
```

## Glow Effects

Key to the sci-fi aesthetic are glowing elements:

```css
--glow-primary: 0 0 10px var(--color-primary), 
                0 0 20px rgba(0, 240, 255, 0.3);
--glow-secondary: 0 0 10px var(--color-secondary), 
                  0 0 20px rgba(255, 153, 0, 0.3);
--glow-danger: 0 0 10px var(--color-danger), 
               0 0 20px rgba(255, 51, 102, 0.3);
```

Apply via `box-shadow` or `text-shadow`:

```css
.glowing-element {
    box-shadow: var(--glow-primary);
}

.glowing-text {
    text-shadow: var(--glow-primary);
}
```

## Typography

### Font Stack

```css
font-family: 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
```

A clean sans-serif stack that's available on most systems.

### Text Styles

| Element | Size | Weight | Transform |
|---------|------|--------|-----------|
| Ship Name | 18px | 600 | None |
| Headers (h3) | 12px | 500 | UPPERCASE |
| Body Text | 14px | 400 | None |
| Labels | 11-12px | 500 | UPPERCASE |
| Monospace Values | 14px | 400 | None |

### Letter Spacing

Headers and labels use `letter-spacing: 1px` for a more technical feel.

## Component Patterns

### Panels

The basic container for grouped UI elements:

```css
.panel {
    background: var(--bg-panel);
    border: 1px solid rgba(0, 240, 255, 0.3);
    border-radius: var(--radius-md);  /* 8px */
    padding: var(--spacing-md);       /* 16px */
    backdrop-filter: blur(10px);
}
```

### Buttons

**Primary Button:**
```css
.btn {
    background: rgba(0, 240, 255, 0.1);
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    border-radius: var(--radius-sm);  /* 4px */
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.btn:hover {
    background: rgba(0, 240, 255, 0.2);
    box-shadow: var(--glow-primary);
}
```

**Button Variants:**
- `.btn-primary` - Emphasized primary action
- `.btn-secondary` - Muted, less important
- `.btn-danger` - Destructive/weapon actions (red)
- `.btn-warning` - Caution actions (orange)
- `.btn-small` - Compact size
- `.btn-large` - Full-width, prominent

### Progress Bars

```css
.progress-bar {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(0, 240, 255, 0.2);
    border-radius: 6px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    transition: width 0.3s ease;
}
```

**Fill Variants:**
- `.hull-fill` - Gradient from red to green
- `.shield-fill` - Blue gradient
- `.phaser-fill` - Red to orange
- `.health-good/warning/critical` - Solid colors

### Inputs

```css
.select-input, input[type="number"], textarea {
    background: var(--bg-input);
    border: 1px solid rgba(0, 240, 255, 0.3);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
}

/* Focus state */
.select-input:focus {
    border-color: var(--color-primary);
    box-shadow: var(--glow-primary);
}
```

### Range Sliders

Custom-styled for consistency:

```css
input[type="range"] {
    -webkit-appearance: none;
    background: rgba(0, 240, 255, 0.2);
    border-radius: 4px;
}

input[type="range"]::-webkit-slider-thumb {
    background: var(--color-primary);
    border-radius: 50%;
    box-shadow: var(--glow-primary);
}
```

## Layout System

### Station Layouts

Each station uses CSS Grid with a sidebar + main pattern:

```css
.station-layout {
    display: grid;
    height: 100%;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
}

/* Tactical example */
.tactical-layout {
    grid-template-columns: 300px 1fr;
}

/* Weapons example (sidebar on right) */
.weapons-layout {
    grid-template-columns: 1fr 320px;
}
```

### Spacing Scale

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

### Border Radius Scale

```css
--radius-sm: 4px;   /* Buttons, inputs */
--radius-md: 8px;   /* Panels */
--radius-lg: 16px;  /* Large containers */
```

## Animation Patterns

### Transitions

```css
--transition-fast: 0.15s ease;   /* Hover states */
--transition-normal: 0.3s ease;  /* State changes */
```

### Alert Pulses

```css
@keyframes pulse-yellow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

@keyframes pulse-red {
    0%, 100% { opacity: 1; box-shadow: var(--glow-danger); }
    50% { opacity: 0.7; box-shadow: none; }
}
```

### Critical System Pulse

```css
@keyframes pulse-critical {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
```

## Canvas Rendering Style

### Ship Rendering

```javascript
// Faction colors for ships
const colors = {
    friendly: { main: '#00ff88', glow: 'rgba(0, 255, 136, 0.3)' },
    neutral: { main: '#ffcc00', glow: 'rgba(255, 204, 0, 0.3)' },
    hostile: { main: '#ff3366', glow: 'rgba(255, 51, 102, 0.3)' }
};

// Glow effect via shadowBlur
ctx.shadowColor = color.main;
ctx.shadowBlur = isPlayer ? 20 : 10;
```

### Grid Overlay

```javascript
// Subtle grid lines
const gridColor = 'rgba(0, 150, 180, 0.1)';
```

### Stars

```javascript
// Slightly blue-tinted white stars
ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
```

### Visual Effects

**Phaser Beams:**
- Outer glow: Red, 8px wide
- Inner beam: Light orange, 3px wide
- Core: White, 1px wide
- Fade out over 15 frames

**Torpedoes:**
- Orange ellipse body
- Trailing gradient

**Waypoints:**
- Pulsing cyan ring
- Diamond center marker

## Responsive Design

At smaller screens (< 1200px), layouts switch to single-column:

```css
@media (max-width: 1200px) {
    .tactical-layout {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
    }
}
```

Sidebar panels wrap into a horizontal flex layout.

## Accessibility

### Focus States

All interactive elements have visible focus indicators:

```css
button:focus, input:focus, select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--glow-primary);
}
```

### Color Contrast

- Text on dark backgrounds maintains 4.5:1 contrast ratio
- Primary cyan (#00f0ff) on dark (#0a0a12) = 10.4:1
- Status colors are distinct even for colorblind users

### ARIA Roles

Tab navigation uses proper ARIA:
- `role="tablist"` on container
- `role="tab"` on buttons with `aria-selected`
- `role="tabpanel"` on content with `aria-labelledby`

## Customization Examples

### Changing to a Red/Orange Theme

```css
:root {
    --color-primary: #ff6600;
    --color-secondary: #ff0066;
    --glow-primary: 0 0 10px #ff6600, 0 0 20px rgba(255, 102, 0, 0.3);
}
```

### Adding a New Alert Level (Blue Alert)

```css
.alert-indicator.blue {
    background: rgba(0, 100, 255, 0.2);
    color: #0066ff;
    border: 1px solid #0066ff;
    animation: pulse-blue 1.5s ease-in-out infinite;
}

@keyframes pulse-blue {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}
```

### Custom Ship Type Styling

In the renderer, add a visual variant:

```javascript
if (ship.type === 'battleship') {
    // Draw larger, more detailed shape
    ctx.scale(1.5, 1.5);
}
```
