// Relief — one fixed field, one travelling level.
//
// THE FIELD NEVER CHANGES AND NOTHING ON SCREEN EVER MOVES. A scalar height
// field is built once per scene and drawn once as a topographic contour stack.
// The only thing that animates in the entire piece is a single number: the
// elevation L currently being lit. Contours within a few levels of L brighten,
// everything else stays dim. What reads as a waterline sweeping up through a
// landscape is a highlight walking a stack of lines that are all already there.
//
// This is deliberately the inverse of a piece that re-blurs its field every
// frame and cuts at a fixed threshold. Here the threshold moves and the field
// is frozen, which is what lets the whole map be rasterised ONCE into an
// offscreen canvas and redrawn with a single drawImage. Per frame the engine
// strokes about eight paths; the other twenty-four are a bitmap.
//
// THE WORD IS A PLATEAU, NOT A DRAWING. The field is a blurred word mask plus
// terrain noise, and the word's letterforms are exactly the contour at one
// elevation — KEY. At every other elevation the same field is landscape. So
// the word is not revealed by being drawn, it is revealed by the sweep
// arriving at the one height where its outline closes. The terrain is tuned
// loud enough that several noise hills crest above KEY too, which is what
// keeps the plateau camouflaged until its own contour lights.
//
// NOISE RUNS ON BOTH SIDES OF A DEAD BAND. Terrain is gated off across the
// whole stretch of blurred mask the key contour lives in (b from 0.30 to 0.76)
// and runs at full strength outside it — low ground AND letter plateau. The
// plateau has to be textured: a perfectly smooth interior in an otherwise
// noisy map gives the word away long before its contour lights.
//
// The dead band cannot be narrowed to buy more texture, and this is the one
// non-obvious constraint in the piece. Inside the band h = 0.86b + A·n·gate(b),
// so the field stays monotone across the crossing only while A·max|n|·max|gate'|
// < 0.86. A smoothstep of width W has max slope 1.5/W, so tightening W makes
// the gate's own ramp steeper than the mask it rides on, h doubles back, and
// the contour at KEY picks up spurious branches — the gold line comes out
// ragged and doubled rather than a letterform. Gating from both ends keeps the
// ramps entirely outside the band and leaves b = 0.5 the only crossing.
//
// THE SWEEP PASSES CLEAN THROUGH BOTH ENDS. L travels four levels below the
// lowest contour and four above the highest, so at the wrap nothing at all is
// lit — and that empty frame is where the next word, terrain and palette cut
// in. No fade, no mask, no transition code: the piece has an unlit frame
// because the sweep was given somewhere to go, and the scene change hides
// inside it.

import { sampleMonotone } from '../math';

export const sample = sampleMonotone;

// EVERY LENGTH HERE IS A FRACTION OF CARD HEIGHT, NOT A PIXEL COUNT. The same
// card runs at 620px tall in a wide layout and about 237px in the feed column,
// and an absolute blur radius is 3.5% of the first and 9% of the second — at
// which point the letters merge into one plateau and the word is gone. Fixing
// the grid at a constant number of ROWS has the useful side effect of making
// the blur radius and the terrain wavelength constant in grid cells, so the
// field is literally the same field at any size.
export const GRID_ROWS = 200;    // field samples down the card, at any size
export const BLUR_FRAC = 0.0355; // mask blur as a fraction of height
export const NOISE_AMP = 0.44;
export const NOISE_FRAC = 0.306; // terrain feature size as a fraction of height

// Enough levels to cover b*0.86 + NOISE_AMP, since terrain now runs over the
// letter plateaus as well and those crest well above the key.
export const NLEV = 50;
export const KEY_INDEX = 16;
export const STEP = 0.0265;
export const KEY = 0.43;         // where the blurred mask crosses 0.5 with the gate shut
export const LEV0 = KEY - KEY_INDEX * STEP;

/** Elevation of contour i. */
export function levelAt(i) {
  return LEV0 + i * STEP;
}

// How far either side of L a contour still brightens, in levels. Wide enough
// that the word assembles as the sweep approaches rather than snapping on.
export const BAND = 2.4;

// The sweep runs past both ends of the stack so the wrap lands on a dead frame.
export const MARGIN = 4;
export const L_MIN = levelAt(0) - MARGIN * STEP;
export const L_MAX = levelAt(NLEV - 1) + MARGIN * STEP;
export const P_KEY = (KEY - L_MIN) / (L_MAX - L_MIN);

export const CYCLE_SEC = 7.4;

/**
 * Normalised sweep position over the cycle. Monotone, 0 to 1, with a hold at
 * P_KEY so the word is legible for about a fifth of the loop. The trajectory
 * is a plain linear climb; only the pacing is shaped, so the stack is always
 * crossed in the same order at the same relative spacing.
 */
// Built around P_KEY rather than written out, so the hold lands exactly on the
// word's elevation whatever the level stack is. Hard-coding the knots means any
// change to NLEV or NOISE_AMP silently moves P_KEY past them and the table stops
// being monotone.
const PRE = [0, 0.09, 0.2, 0.34, 0.5, 0.67, 0.84, 0.95];
const POST = [0.06, 0.16, 0.3, 0.46, 0.63, 0.8, 0.93, 1];
const HOLD = 4;
export const SWEEP_TABLE = [
  ...PRE.map((v) => v * P_KEY),
  ...Array.from({ length: HOLD }, () => P_KEY),
  ...POST.map((v) => P_KEY + v * (1 - P_KEY)),
];

/**
 * Three scenes. Each is a different word, a different terrain seed and its own
 * two-colour map, and all three are cut on the same dead frame.
 */
export const SCENES = [
  { word: 'relief', seed: 3,  bg: '#0d1b2a', line: '#3f7f93', key: '#ffd34e' },
  { word: 'strata', seed: 17, bg: '#f2ece0', line: '#b0a089', key: '#c8402f' },
  { word: 'fathom', seed: 41, bg: '#14121a', line: '#6b5b8a', key: '#7dffb0' },
];
