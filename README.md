# PATCH

**Modular parameter controls for React.**

Rotary knobs, toggles, color wells, scene morphing, and parameter linking — wired directly to your component values.

Think synth rack for your UI. Drop a hook into any component, get a floating panel with hardware-style controls, and tweak values in real time. Copy the final values as code. Ship it.

## Install

```bash
npm install patchui
```

## Quick Start

**1. Mount the panel root (once, at your layout level):**

```tsx
import { PatchRoot } from 'patchui'
import 'patchui/styles.css'

export default function Layout({ children }) {
  return (
    <>
      {children}
      <PatchRoot />
    </>
  )
}
```

**2. Wire parameters in any component:**

```tsx
import { usePatch, link } from 'patchui'

function Card() {
  const p = usePatch('Card', {
    blur: [24, 0, 100],         // [default, min, max] → knob
    opacity: [0.8, 0, 1],
    scale: 1.18,                // bare number → auto-range knob
    color: '#ff5500',           // hex string → color well
    visible: true,              // boolean → toggle

    shadow: {                   // nested object → module
      offsetY: [8, 0, 24],
      blur: link('shadow.offsetY', v => v * 2),  // linked param
    },
  })

  return (
    <div
      style={{
        filter: `blur(${p.blur}px)`,
        opacity: p.visible ? p.opacity : 0,
        color: p.color,
        boxShadow: `0 ${p.shadow.offsetY}px ${p.shadow.blur}px rgba(0,0,0,0.2)`,
      }}
    />
  )
}
```

That's it. A PATCH panel appears with rotary knobs for every numeric value, toggles for booleans, and color wells for hex strings. Nested objects become collapsible modules.

## Scenes

Define named parameter snapshots and crossfade between them:

```tsx
const p = usePatch('Hero', {
  fontSize: [48, 24, 96],
  weight: [800, 300, 900],
  padding: [40, 16, 80],
  accent: '#f59e0b',
}, {
  scenes: {
    editorial: { fontSize: 72, weight: 300, padding: 64, accent: '#ffffff' },
    playful:   { fontSize: 36, weight: 900, padding: 24, accent: '#f472b6' },
    corporate: { fontSize: 42, weight: 600, padding: 48, accent: '#3b82f6' },
  },
  morphDuration: 400,
})
```

Click a scene button and all values animate smoothly. Drag the morph slider to manually crossfade between any two scenes. Colors interpolate per-channel.

## Parameter Linking

Wire parameters together so turning one knob drives multiple values:

```tsx
const p = usePatch('Card', {
  elevation: [2, 0, 5],
  shadowY:       link('elevation', e => e * 4),
  shadowBlur:    link('elevation', e => e * 8),
  shadowOpacity: link('elevation', e => e * 0.04),
  translateY:    link('elevation', e => e * -1),
})

// Turn one knob. Four values respond.
```

## Config Types

| Format | Control | Description |
|--------|---------|-------------|
| `[default, min, max, step?]` | Knob | Explicit range with optional step |
| `number` | Knob | Auto-inferred range |
| `boolean` | Toggle | On/off switch |
| `"#hex"` | Color Well | Hex color picker |
| `"string"` | Text Input | Editable text field |
| `link(path, fn)` | Linked Knob | Computed from another param |
| `{ type: 'spring', ... }` | Spring Editor | Visual spring curve |
| `{ type: 'select', options }` | Selector | Dropdown |
| `{ type: 'action' }` | Button | Triggers callback |
| `{ nested: ... }` | Module | Collapsible group with solo/mute |

## API

### `usePatch(name, config, options?)`

| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | Module title in the panel |
| `config` | `PatchConfig` | Parameter definitions |
| `options.scenes` | `Record<string, Partial>` | Named parameter snapshots |
| `options.morphDuration` | `number` | Crossfade duration in ms (default 300) |
| `options.onAction` | `(action: string) => void` | Callback for action buttons |
| `options.collapsed` | `boolean` | Start module collapsed |

Returns a reactive object matching the shape of your config, with live values updated by the panel.

### `<PatchRoot />`

Mount once at your app root. The panel renders via a portal.

| Prop | Type | Default |
|------|------|---------|
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` |
| `shortcut` | `string` | `'Alt+P'` |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` |
| `zIndex` | `number` | `99999` |

### `link(source, transform)`

Creates a reactive link between parameters. When the source value changes, the linked parameter recomputes automatically.

```tsx
link('elevation', e => e * 4)  // follows 'elevation', multiplied by 4
```

## Accessibility

PATCH follows WCAG 2.1 AA guidelines:

- All controls are keyboard-operable (arrow keys, Page Up/Down, Home/End)
- Proper ARIA roles (`slider`, `switch`) with live value announcements
- Visible focus indicators on every interactive element
- `prefers-reduced-motion` disables all animations
- Color contrast ratios meet 4.5:1 minimum throughout

## Tree-Shaking

PATCH is dev-only by design. Wrap it in an environment check to strip it from production:

```tsx
// layout.tsx
const DevPatch = process.env.NODE_ENV === 'development'
  ? require('patchui').PatchRoot
  : () => null
```

Or use dynamic imports:

```tsx
import dynamic from 'next/dynamic'
const PatchRoot = dynamic(() => import('patchui').then(m => m.PatchRoot), {
  ssr: false,
})
```

## License

MIT
