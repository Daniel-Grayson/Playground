# Handoff

Written for whoever picks this up next — human or another Claude session. It
covers what this is, where it stands, how it works, and the mistakes already
made so they are not made again.

There is no literal transcript of the session that built this. It lived in an
ephemeral container. Everything that mattered is written down here instead.

---

## 1. What this is

Daniel Grayson is building a vault of interactive canvas pieces to port into
his portfolio. The reference is **Arlan Marat's vault** (https://www.arlan.me/vault)
— its layout, its card rhythm, and above all its *way of making things*: each
piece is one stated mechanism rather than a pile of tweened states.

Secondary references looked at along the way: bencho.dev,
interactiondesign.framer.website, moment.so/explore.

**Standing constraints from the user, still in force:**

- Develop on branch `claude/arlan-vault-review-wwi9lk`. Never push elsewhere.
- Do not open a pull request unless explicitly asked.
- **No in-page clicking.** There is no detail view, no lightbox, no routing.
  Everything is one scrolling page. Hover interactions are fine.
- Cards have **no outline/border**. Label under each card is the **name only**,
  left-aligned; there was a right-hand label and it was removed.
- Type is **PP Mori**.
- "Rich in colour" means **two colours per card with variety across cards** —
  not many hues inside one card. This was an explicit correction; do not
  reintroduce five-colour ramps.
- Layout metrics are **measured from Arlan, not guessed**: 560px column,
  12px card radius, 32px row gap. An earlier guess of 1040px/24px/72px was
  wrong and the user caught it.

## 2. Where it stands

Branch `claude/arlan-vault-review-wwi9lk`, head `9c5981a`. Build is clean, the
page renders at 390 / 768 / 1240px with no horizontal overflow and no console
errors.

Recent commits:

```
9c5981a Fix Loom washing out on 1x displays
e9f04fa Remove Slat and the page footer
6520f87 Add six original explorations: Relief, Slat, Loom, Press, Tumble, Marble
c9fd9df Add Moiré type
e6f6e57 Cut to four effects, add Stamp type, set in PP Mori
7d724f4 Add Flood type
```

**Eleven effects, in page order:** Lamp, Plate, Leader, Relief, Loom, Transit,
Tumble, Marble, Moiré type, Ember type, Echo trail.

**New cards go to the TOP of the feed.** A standing instruction from the
user, so the newest work is the first thing seen. Order in `lib/registry.js`
is page order, so a new effect's entry goes first in `EFFECTS`.

Of these:
- **Leader** and **Transit** began as `flood-type` and `stamp-type`, built to
  written specs taken verbatim from Arlan's style, and were later re-subjected
  because they read as rip-offs. **The motion was deliberately kept**: Leader
  still runs the measured zoom/turn/enter/fall tables, Transit still stamps a
  silhouette with a 16-frame life. What changed is every layer that carried
  his authorship — the names, the subject, the palettes, the type treatment —
  and, in Transit's case, the track data, which had been traced from his piece
  coordinate by coordinate and is now written for this one. The guiding idea
  was that a mechanism is a technique (Ember is Doom's fire routine, Marble is
  suminagashi) but an artefact is not, so each piece was given a subject that
  genuinely demands the motion: a leader numeral has to overrun the frame, and
  a parcel through customs has to collect a stamp at every stop.
- **Moiré type** was the first original, made after studying Arlan's work.
- **Relief, Loom, Tumble, Marble** are originals from a later round.
- **Lamp** was built from a screenshot the user supplied of a nav bar, with a
  horse mark and the labels Home and Works at their request. The mark is the
  user's own horse, pasted from Figma as SVG and kept at `lib/lamp/horse.svg`;
  `params.js` carries its path verbatim. The engine articulates and lights
  the vector, then rasterises the RESULT to a 20-row buffer and scales it up
  with smoothing off, so the mark reads as pixel art while the geometry
  underneath is real. The user asked for the pixel look back after seeing a
  smooth version; rasterising the animation rather than the artwork is what
  gives them both, since a bitmap of a fixed pose has no leg in it to swing. They sent
  four horses, but the four are different illustrations rather than one horse
  in four positions (silhouette overlap only ~0.5, where a real stride cycle
  is 0.8+), so cutting between them read as four horses flickering. Instead each leg is clipped out of the single path and
  swung about its own joint, with the body drawn back over the cuts \u2014 the
  clips must be narrow and must start below the row where a pair stops
  overlapping, or the rotation swings a visible notch out of the shoulder. **Attached image files do
  not reach the container — only pasted text does**, which is why the SVG
  route was needed at all. The composition is the
  screenshot's own: a grey page, a dark panel inset from the top left with a
  single rounded corner running off the right and bottom edges, and the bar at
  the top of that panel. Colours and the panel's offsets were sampled from the
  screenshot rather than guessed. It is the one card that carries three
  colours instead of two, because the reference does. The horse prances on hover, also at their request.
- **Plate** recreates the Red Dead Redemption 2 loading screen (a photograph
  developing from its own negative), studied from a screen recording the user
  supplied, and made cursor-driven at the user's request. Every 5s a ring of
  heat carries the next photograph across (the user asked for the change and
  for the earlier idle drift to be removed). Its photographs are public-domain
  1860s survey plates, levelled and cropped to 3:2 into `public/plate/`; it is
  the only effect that loads assets. Credits are in `lib/plate/params.js`.
- **Ember type** and **Echo trail** predate all of that and are the only two
  still written against the `useCanvas` React hook rather than as engine
  classes.

**Slat** (a lenticular prism piece) was built and then removed on request.
It is in history at `6520f87` if it is ever wanted back. **Press** (four ink
plates drifting out of register) was removed the same way; it is intact at
`063d0d0`.

### Things that are NOT done

- `public/fonts/PPMori-Regular.woff2` and `PPMori-SemiBold.woff2` are missing.
  PP Mori is a licensed Pangram Pangram face so the files cannot be committed.
  Until the user drops them in, there are two 404s and everything falls back to
  the system grotesque. **This is expected, not a bug.**
- `README.md` is **stale and misleading**. It says "four kinetic-type studies"
  and documents `lib/gl.js`, `lib/scene.js`, `lib/controls.js`, a `FlowField`
  component and per-effect props — all deleted. It also has `## Layout` twice.
  Its run instructions are correct; little else is.
- `lib/controls.js` is dead code. Nothing imports it and it only describes
  `ember-type` and `echo-trail`. Left in place rather than deleted unasked.
- Not deployed. The user wants a URL that works without their laptop running;
  Vercel was suggested and not yet set up.

### The hosted preview

A framework-free build of the whole feed was published as a Claude Artifact:
`https://claude.ai/artifact/ESxfcrzK6zScmB71NcGnLB`

**It is private to the account that made it.** A different account cannot open
it. It is also a snapshot, not a live mirror — it does not track the repo. The
build recipe is in §7 if it needs remaking.

## 3. What a new session needs

- **GitHub access to `Daniel-Grayson/Playground`.** A new account will need its
  own connection; reconnect at claude.ai Settings → Connectors, and install the
  Claude GitHub App on the repo if prompted.
- Node 20+. Built and verified on 22.22.
- Nothing else. No env vars, no services, no API keys.

## 4. Running and verifying

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # must stay clean
```

The dev server occupies its terminal; closing the window kills it. The user
asked about this twice, so be explicit if it comes up again.

## 5. Architecture

```
app/page.jsx          the entire site: header + <Feed>
app/globals.css       theme tokens, @font-face, .shell / .feed / .feed-card
components/Feed.jsx   maps EFFECTS to cards; sets per-card CSS variables
components/EffectLoader.jsx   slug -> dynamic import, ssr:false
components/effects/   one wrapper component per effect
lib/registry.js       EFFECTS: slug, title, category, aspect, card, tags,
                      blurb, mechanism. Order here is page order.
lib/palette.js        cardVars(bg, ink, accent) -> the full token set
lib/math.js           easing, damp, rng, noise, sampleMonotone
lib/useCanvas.js      the rAF/DPR/visibility/pointer hook (Ember, Echo only)
lib/<name>/params.js  every constant + the written-up mechanism
lib/<name>/engine.js  the engine class
```

### The engine-class pattern (use this for anything new)

Nine of the eleven effects are a plain class with this surface:

```js
export class Thing {
  ok = false;
  constructor(canvas) { /* getContext, measure() */ }
  measure()            // dpr cap 2, size the backing store, derive constants
  drawAt(t)            // render the frame at time t — PURE, no accumulation
  setPointer(x, y)     // optional, CSS px
  clearPointer()       // optional
  start() / stop()
  resize()
  renderStill()        // one frame for prefers-reduced-motion
  destroy()
}
```

The wrapper component is boilerplate: build on the next rAF, IntersectionObserver
at `threshold: 0.2` to start/stop, `visibilitychange`, a ResizeObserver calling
`resize()`, and pointer listeners when the engine has `setPointer`. Copy
`components/effects/ReliefContour.jsx` and change two lines.

**`drawAt(t)` must be a pure function of `t`.** Every effect except Marble
recomputes from scratch each frame. This is what makes resize, tab-resume and
the loop seam correct rather than approximately correct. Marble cannot be pure
(it is a sequence of accumulated transforms) so it instead replays from tick 0
whenever a seek goes backwards or jumps — same guarantee, different mechanism.
Lamp is a third exception, and the mildest: its state is the lamp's own
position, damped toward a target. That is not accumulation in the sense
purity protects against — a damped follower converges from wherever it is, so
a resize and a tab-resume heal themselves in a few frames.

Plate cannot be pure either: its state is the pointer's history. It has no
`drawAt`; it runs fixed 60Hz ticks capped per frame, keeps its heat field in
grid cells so a resize preserves it, and exposes `runFor(seconds)` for probes.

### Colour

Effects never take colour props. `Feed.jsx` sets `--bg`, `--text`, `--accent`
etc. on each card via `cardVars()`, and CSS custom properties inherit, so the
canvas inside re-skins with no prop plumbing. Pieces with their own internal
palettes (most of the new ones) carry them in their own `params.js`.

### Scale

**Any length that affects legibility must be a fraction of card height, not a
pixel count.** The same card is ~620px tall in a wide layout and ~165px at
phone width. This caused a real bug — see §6.

## 6. Bugs already found and fixed — do not reintroduce

These are the expensive ones. Each is also written up in the relevant
`params.js` header.

1. **Transit (then Stamp type) rendered as a flat blue rectangle.** The first rAF timestamp
   can predate the `performance.now()` captured in `start()`, so the first
   delta is negative, `acc` goes just below zero, `Math.floor` of a small
   negative is `-1`, and `worlds[-1]` is undefined. Fixed with
   `Math.max(0, ...)` in both Arlan engines. **This is a bug in the reference
   implementation, not in the port.**

2. **Relief's key contour came out ragged and doubled.** Gating terrain noise
   on `|b - 0.5|` perturbs the crossing itself. Inside the band
   `h = 0.86b + A·n·gate(b)`, and a smoothstep of width W has max slope 1.5/W,
   so a narrow gate is steeper than the mask it rides on, `h` doubles back, and
   the contour picks up spurious branches. Fixed by gating from **both ends**
   with a dead band across the crossing.

3. **Loom's first version was invisible.** The motif was made by flipping the
   over/under parity of a plain weave. A one-cell phase shift in a checkerboard
   carries almost no tonal weight. Rebuilt as damask: the motif is a change of
   **float length** (4 vs 1 in a five-end satin), which is why real damask is
   woven that way.

4. **Loom washed out on 1x displays.** The thread pitch floor was in CSS pixels,
   which is 2x bigger on a retina screen. A thread is inset a pixel each side,
   so at 4 device px only 2px of thread survives and the gradients average the
   cloth to mud. The floor is now **7 device px**. Every check before this had
   run at dpr 2, which is why it survived so long.

5. **Three effects broke at real card size.** Probes ran at 1200px wide; the
   feed column is 512, and 358 on a phone. `BLUR_PX = 22` is 3.5% of a 620px
   card and 13% of a 165px one — Relief's letters merged into one plateau,
   Tumble got under four rows of cubes, Loom under 26 threads. All now
   height-proportional.

6. **Marble's clearing drop covered the card in two ticks.** Drops at one centre
   compose by adding r², so equal increments grow the radius as √n, which
   front-loads badly. Each increment is now solved from the radius curve either
   side of it: `dr = sqrt(r1² - r0²)`. Still exact, correctly paced.

7. **Marble tore straight chords across the feathers.** The comb's steepest
   gradient is `0.6495·α/λ`, so 700 vertices per ring was not enough after the
   drops had already stretched them. Now 1500.

8. **Marble's first version was random blobs.** The drops were scattered.
   Suminagashi is *concentric* — the same point dropped on repeatedly. Also a
   colour-cycling bug: with 18 stacks and 6 inks, `(ink++) % 6` gave every stack
   the same colour at every layer, so each painted as one solid blob instead of
   rings. Ink index must advance per stack as well as per layer.

9. **Slat's shading washed the inks out.** A white overlay on a saturated ink
   reads as a faded print, not a lit surface. Darken-only, normalised at the
   face-on angle, so a face square to the camera is never touched.

10. **Clicks shorter than one frame were dropped.** `useCanvas` now queues
    presses (`consumePress()`) rather than sampling a boolean.

11. **Stale `.next` chunks returned HTTP 500** after rebuilding under a running
    `next start`. Always restart the server after a build.

12. **A python brace-counter corrupted `lib/registry.js`** (kept 1 of 1 entries).
    Do not write ad-hoc parsers for source files; use targeted string replaces
    and check the result.

## 7. The verification toolkit

This is how everything above was caught. Reuse it.

**Probing an engine without booting Next.** Serve the repo and load the engine
as a module in a real browser. The catch: imports are extensionless
(`from './params'`), which the bundler resolves and a browser does not — so
either add an import map or bundle.

```bash
python3 -m http.server 8099 --directory /path/to/Playground
```

Then a page that imports `lib/<name>/engine.js`, constructs the class, and
exposes `window.__seek = t => engine.drawAt(t)`. Drive it with Playwright,
seek to chosen times, screenshot the card element. Because `drawAt` is pure,
this gives exact frames at exact timeline positions.

**Playwright and Chromium are pre-installed:**

```js
import pw from '/opt/node-tools/node_modules/playwright/index.js';
const b = await pw.chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--font-render-hinting=none'],
});
```

**Check at `deviceScaleFactor: 1` as well as 2.** Bug 4 only appears at 1.

**Check blankness numerically, not by eye** — count distinct colours and the
largest flat area; flag anything with under ~5 colours or over 98.5% one colour.

**Verify params in the browser, not Node.** Node cannot resolve the
extensionless imports either. Load the module in the page and evaluate an
expression against it. Worth checking: that timing tables are monotone, that
they hit 0 and 1 exactly at the ends, and that holds land where intended.

**Bundling for a standalone page:**

```bash
npx esbuild entry.js --bundle --format=iife --minify --target=es2020 --outfile=bundle.js
```

esbuild resolves the extensionless imports fine. The entry imports `EFFECTS`
and `cardVars` straight from the repo, maps slug to engine class, and
reimplements the two React drivers in plain JS (~110 lines). Ember and Echo
need a vanilla port of `useCanvas`.

## 8. The ten effects

Each `params.js` opens with a full written-up mechanism. Short form:

| | mechanism | transition |
|---|---|---|
| **Lamp** | one inverse-square field: sampled per glyph, poured through the mark, then rasterised | the stride ends on its own rest frame, so there is no settle tween |
| **Plate** | one photo, positive over its own negative with development as alpha; equal tonal span makes d = 0.5 uniform grey | a heat ring; each cell swaps plate as it passes d = 0.5, where it shows no image |
| **Relief** | field frozen, only the lit elevation moves; the word is the contour at one height | sweep runs past both ends, the wrap is a dead frame |
| **Loom** | five-end satin; the motif is float length 4 vs 1 | both sides reach 3, the motif is absent |
| **Tumble** | rhombille; `tone[(k + g) % 3]`, generation closed-form from travelling fronts | the front carries the next palette |
| **Marble** | two closed-form point transforms, 30Hz tick timeline | the clearing drop is just another drop |
| **Moiré type** | the word is only where two rulings disagree | at zero divergence the field is uniform |
| **Leader** | global ramps + four constants per letter; 3D is one cosine | the lines run in order, stock changes each card |
| **Transit** | text on bars walking a breakpoint track, stamping residue | incoming pass overlaps the outgoing by 12 frames |
| **Ember type** | Doom's 1993 fire routine, seeded from the word's pixels | — |
| **Echo trail** | ring buffer of stamped copies | — |

## 9. The principles these were built on

Distilled from nine of Arlan's studies (flood-type, stamp-type, warp-type,
pop-type, checker-conveyor, datamosh, gold-scar, word-stickers, cloud-type).
This is the actual design brief for anything new.

1. **One field, cut once.** Do not model the states; model a continuum and
   threshold it. The states become positions along a parameter.
2. **The transition is the mechanism running.** A conveyor seam, an empty
   divergence frame, a burst already coloured as the next scene. Never a
   crossfade bolted on.
3. **Identity, never position.** Colour and sampling key off a stable id;
   anything keyed to screen position appears to swipe.
4. **Unbounded phase.** `id = -floor(flow) + n`. Wrapping is a teleport unless
   everything wraps together.
5. **One law, staggered by geometry.** `τ = t - x/v` beats per-element tables.
6. **Separate the trajectory from the pacing.** Monotone remaps that hit 0 and
   1 exactly change feel without touching schedule.
7. **Ship the measurements.** Tables with their hand jitter beat a closed form,
   and the fit is scored where the eye looks, not where the samples are.
8. **Monotone cubic, always** (`sampleMonotone` in `lib/math.js`). Overshoot is
   a defect here, not a flourish: it runs a shape past its landing and back.
9. **Hunt the degenerate region.** Clamped tails, flat stretches grazing a
   threshold, aliasing on a periodic pattern. Every one produced a visible
   artifact.
10. **Let a constraint do the work.** Binary output forces stochastic AA; no
    alpha forces amplitude-based vanishing; a fixed column grid forces all
    motion into one axis.

One more, from Arlan's own notes and worth keeping: **measure periodic patterns
by their defects, not their bodies.** Cross-correlation on a checkerboard locks
onto the nearest alias and under-reports by more than half, plausibly and
silently. Track a unique feature instead.

## 10. Suggested next steps

In the order they would most help:

1. Rewrite `README.md` to match reality (see §2).
2. Set up Vercel so there is a permanent URL that rebuilds on push. Needs the
   user's account, so it is a few clicks on their end.
3. Delete `lib/controls.js` if the user confirms nothing is coming back.
4. Add the PP Mori woff2 files when the user has them.
