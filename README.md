# Vault

Four kinetic-type studies, each a self-contained React component with **no
dependencies beyond React itself**, written to be lifted straight into a
portfolio.

| | |
|---|---|
| **Flood type** | A wordmark falls in, holds, then rushes the camera until it overruns the frame |
| **Stamp type** | Four lines on flat bars hop in, park to be read, scatter — leaving printed residue |
| **Ember type** | Doom's 1993 fire routine, seeded from the word's own pixels |
| **Echo trail** | A word smeared into dozens of fading copies behind the pointer |

Flood type and Stamp type are built to written specs and carry their own
palettes and timelines in `lib/flood/params.js` and `lib/stamp/params.js` —
every number the pieces run on is in those two files.

## Type

The type is **PP Mori** (Pangram Pangram), a licensed face, so the files are
not committed. Drop `PPMori-Regular.woff2` and `PPMori-SemiBold.woff2` into
`public/fonts` and everything picks them up; until then it falls back to the
system grotesque. See `public/fonts/README.md`.

```bash
npm install
npm run dev     # http://localhost:3000
```

## Taking one into your portfolio

Every effect is self-contained. To use one, copy two things:

1. the component — `components/effects/<Name>.jsx`
2. the helpers it imports from `lib/` (usually `useCanvas.js` + `math.js`)

Then drop it in:

```jsx
import FlowField from '@/components/effects/FlowField';

<div style={{ height: 420 }}>
  <FlowField count={1800} speed={0.8} />
</div>
```

Each one fills its parent, so the parent needs a height. Every prop is listed
in `lib/controls.js` with its default and sensible range — treat that file as
the reference when picking values.

Colours are not props. Each effect reads `--text`, `--bg` and friends from CSS
custom properties on its own element, so you re-skin one by setting those
variables on its container — see `lib/palette.js`, which derives the whole
token set from a background and an ink.

## The engine

`lib/useCanvas.js` is what makes the effects short. It handles, once:

- **device-pixel-ratio** backing store, so nothing renders blurry on retina
- **ResizeObserver** rather than window resize, so effects work in any layout
- an rAF loop that **pauses offscreen** (IntersectionObserver) and on tab hide —
  this is what keeps a page full of canvases from cooking a laptop fan
- **`prefers-reduced-motion`**: renders one static frame instead of animating
- **pointer state** in CSS pixels, with velocity, relative to the canvas, and a
  press *queue* rather than a boolean — a click shorter than one frame still
  registers

An effect supplies `init`, `frame`, and optionally `resize` / `dispose`:

```js
const ref = useCanvas({
  init:  ({ canvas, w, h }) => ({ /* your state */ }),
  frame: ({ ctx, w, h, dpr, t, dt, state, pointer }) => { /* draw */ },
});
return <canvas ref={ref} />;
```

Pass `context: 'webgl2'` for shader effects; `lib/gl.js` compiles a fragment
shader against a fullscreen quad and sets uniforms from a plain object.

## Layout

```
app/page.jsx          the single page — the whole site
components/effects/   the four effects, one file each
lib/flood/            Flood type: params + engine
lib/stamp/            Stamp type: params + engine
lib/useCanvas.js      the rAF/DPR/visibility/pointer engine
lib/gl.js             minimal WebGL2 helper
lib/math.js           easing, damping, seeded RNG, value noise
lib/text.js           render type to a bitmap and sample it
lib/scene.js          the procedural source the shader effects process
lib/registry.js       effect metadata, card aspect ratio and palette
lib/palette.js        derives a card's CSS variables from bg + ink
lib/controls.js       documented parameter ranges per effect
```

## Layout

One centred 560px column with 24px gutters. Cards are 12px radius with a
hairline border, 32px apart, each with its own aspect ratio so the column has
rhythm instead of reading as a uniform stack. Everything is on that one page —
there is nothing to click through to.

## Notes

- No image assets — the shader effects process a procedurally drawn scene, so
  the repo stays text-only.
- Canvas colours are read from CSS custom properties, so effects follow light
  and dark mode automatically.
- DPR is capped at 2: at 3x the same shader costs 2.25x the fill rate for
  differences nobody can see.
