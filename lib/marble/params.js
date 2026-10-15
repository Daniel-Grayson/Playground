// Marble — suminagashi by exact point transforms. No fluid simulation, no
// particles, no texture.
//
// THE PICTURE IS A LIST OF CLOSED POLYLINES AND THE HISTORY OF EVERY
// TRANSFORM APPLIED AFTER THEY WERE LAID DOWN. Two operations, both closed
// form, both applied to every vertex already on the water:
//
//   drop(C, r):  P -> C + (P - C) * sqrt(1 + r^2 / |P - C|^2)
//   tine(line):  P -> P + u * alpha / (1 + (d / lambda)^2)
//
// The drop is area preserving, which is the whole reason this works: dropping
// again on the same spot turns the previous drop into a RING of equal area
// rather than covering it. Concentric rings are not drawn, they are what
// repeated drops leave behind. An early version scattered the drops instead
// of stacking them and produced nothing but random blobs.
//
// DROPS AT ONE CENTRE COMPOSE BY ADDING r SQUARED. Applying r1 then r2 gives
// sqrt(|P|^2 + r1^2 + r2^2), which is exactly the single drop of radius
// sqrt(r1^2 + r2^2). So a growing drop can be animated as a run of equal
// small drops and stay mathematically exact at every frame — and a target
// radius R over T ticks is simply dr = R / sqrt(T).
//
// THE SHEET CLEARS ITSELF WITH THE SAME OPERATION THAT FILLED IT. The last
// act is a drop of clear water at the centre, growing until its disc covers
// the card. Every ring of pigment is pushed outward past the edges by it, and
// because that clear drop is the newest ring it is also the one drawn on top,
// so the sheet is genuinely blank underneath rather than painted over. It is
// given the NEXT scene's paper colour, which makes the clear water and the
// new sheet the same object. There is no transition code in this piece.
//
// EVERY RING IS A SINGLE CLOSED CURVE AND IS FILLED, NOT STROKED. What looks
// like an annulus is a disc with a newer disc on top of it. That is also why
// draw order is insertion order and must stay that way.
//
// TIME IS QUANTISED TO 30Hz AND STATE IS A PURE FUNCTION OF THE TICK. Each
// tick applies exactly one operation. If the requested tick is behind the
// built one, or more than one ahead, the engine replays from zero — so a
// resize, a tab-resume and the loop seam are all correct rather than merely
// close, and nothing accumulates drift across a session.

export const TICK_HZ = 30;

export const STACKS = 10;
export const LAYERS = 5;
export const DROPS = STACKS * LAYERS;

export const DROP_R = 0.155;      // drop radius as a fraction of card height
export const JITTER = 0.012;      // per-drop wobble off its stack centre

export const RAKE_TICKS = 20;
export const RAKE_ALPHA = 0.26;   // total drag, as a fraction of width
export const RAKE_LAMBDA = 0.42;  // falloff, as a fraction of height

export const COMB_TICKS = 30;
export const COMB_TINES = 13;
export const COMB_ALPHA = 0.26;   // total drag, as a fraction of height
export const COMB_LAMBDA = 0.055; // falloff, as a fraction of width

export const HOLD_TICKS = 26;     // the finished sheet, held to be looked at
export const CLEAR_TICKS = 24;
// Final clear radius, as a multiple of the HALF diagonal. It only has to reach
// the corners: the drop map sends every point to at least r, so a clear drop
// of r just over the half diagonal already pushes all the pigment off the
// sheet. Sizing it to the full diagonal and beyond wastes most of the growth
// off-card and makes the sweep look instant.
export const CLEAR_R = 1.15;
// Radius profile across the clear. Equal r increments are the obvious thing
// and they are wrong: drops compose by adding r SQUARED, so equal steps grow
// the radius as sqrt(n) and the disc covers the card in the first few ticks.
// Growing r along a curve and solving each increment from it fixes the pacing
// while keeping every intermediate frame exact.
export const CLEAR_EASE = 1.3;

export const TOTAL_TICKS = DROPS + RAKE_TICKS + COMB_TICKS + HOLD_TICKS + CLEAR_TICKS;

// Vertices per ring. This is a resolution budget, not a style choice: the
// comb's steepest gradient is 0.6495 * alpha / lambda, so a stretch of well
// over 2x in one pass on top of whatever the drops already did. At 700 the
// chords between vertices open up far enough to cut visible straight tears
// across the feathers.
export const RING_PTS = 1500;

/** Stack centres, normalised. Jittered off a grid so the sheet is not a lattice. */
export const STACK_POS = [
  [0.12, 0.26], [0.33, 0.17], [0.52, 0.30], [0.71, 0.16], [0.90, 0.27],
  [0.08, 0.74], [0.28, 0.82], [0.49, 0.70], [0.69, 0.84], [0.89, 0.72],
];

export const SCENES = [
  { paper: '#efe6d2', inks: ['#13293d', '#d1495b', '#00798c', '#edae49', '#8f2d56'] },
  { paper: '#f3ece2', inks: ['#2b2d42', '#ef476f', '#06d6a0', '#ffd166', '#118ab2'] },
  { paper: '#1a1a1f', inks: ['#f2e8d5', '#e4572e', '#76b041', '#2a9d8f', '#c77dff'] },
];

/** Which operation tick n performs. */
export function opAt(n) {
  if (n < DROPS) return { kind: 'drop', i: n };
  let k = n - DROPS;
  if (k < RAKE_TICKS) return { kind: 'rake', i: k };
  k -= RAKE_TICKS;
  if (k < COMB_TICKS) return { kind: 'comb', i: k };
  k -= COMB_TICKS;
  if (k < HOLD_TICKS) return { kind: 'hold', i: k };
  k -= HOLD_TICKS;
  return { kind: 'clear', i: k };
}
