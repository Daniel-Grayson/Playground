# Vault

Interactive studies, built from scratch — typography, shaders, microinteractions
and generative canvases. Seventeen of them, each a single React component with
**no dependencies beyond React itself**, written to be lifted straight into a
portfolio.

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
in `lib/controls.js` with its range, and `/vault/<slug>` gives you live sliders
for all of them — tune it there, then hardcode the numbers you landed on.

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
app/                  gallery (/) and per-effect pages (/vault/[slug])
components/effects/   the seventeen effects, one file each
lib/useCanvas.js      the rAF/DPR/visibility/pointer engine
lib/gl.js             minimal WebGL2 helper
lib/math.js           easing, damping, seeded RNG, value noise
lib/text.js           render type to a bitmap and sample it
lib/scene.js          the procedural source the shader effects process
lib/registry.js       effect metadata (titles, tags, how-it-works)
lib/controls.js       live parameter ranges per effect
```

## Notes

- No image assets — the shader effects process a procedurally drawn scene, so
  the repo stays text-only.
- Canvas colours are read from CSS custom properties, so effects follow light
  and dark mode automatically.
- DPR is capped at 2: at 3x the same shader costs 2.25x the fill rate for
  differences nobody can see.
