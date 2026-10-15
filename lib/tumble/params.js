// Tumble — a rhombille tiling that keeps turning itself inside out.
//
// NOTHING MOVES. Not one vertex changes position for the life of the card.
// The grid is a fixed rhombille: hexagons each cut into three rhombi, shaded
// light, mid and dark so they read as the three faces of a cube seen corner
// on. A cell "flips" by rotating which tone sits on which rhombus — the cube
// appears to pop from convex to concave, and the entire mechanism is
// tone[(k + g) % 3].
//
// THE FRONT CARRIES THE PALETTE. Cells behind a wavefront are drawn in the
// next colourway, cells ahead in the current one, so the boundary that already
// exists to flip the cubes is also the boundary that recolours them. No fade,
// no mask, no second pass: the recolour is a wipe because the flip was a wipe.
// This is the same bargain as a conveyor seam — the transition is the
// mechanism running, not something laid on top of it.
//
// GENERATION IS CLOSED FORM, NOT ACCUMULATED. A cell's state is the number of
// fronts that have passed it, and fronts are evenly spaced in time, so that
// count solves directly:
//
//   g = floor((t - (cx - wobble(cy) + X0) / V) / GAP) + 1, floored at zero
//
// No per-cell state, no loop over fronts, nothing to drift. A resize, a
// tab-resume and the loop seam all land on exactly the right frame because
// every frame is computed from t alone.
//
// THE FLIP IS A HARD CUT ON PURPOSE. Easing a cell between two tone triples
// walks it through colours that belong to neither reading, and the cube stops
// being a cube for the duration. A pop is also what the eye does with a
// bistable figure: it does not dissolve, it switches.

// Hexagon circumradius as a fraction of card height, clamped. Absolute, the
// small card in the feed gets under four rows of cubes and reads as wallpaper
// rather than as a field.
export const R_FRAC = 0.0677;
export const R_MIN = 13;
export const R_MAX = 58;
export const CROSS_SEC = 2.2;    // time for a front to cross the card
export const GAP_SEC = 2.6;      // time between fronts
// The front has to be a WAVE, not a wipe. Two sine terms at short wavelengths
// relative to the card height, so a couple of full bends cross the frame at
// once; a long slow bow reads as a straight edge with a lean on it.
export const WOB1 = 0.16;        // front waviness, as a fraction of width
export const WOB2 = 0.055;
export const WOB_L1 = 110;       // and its wavelengths, in CSS px
export const WOB_L2 = 47;
export const START = 0.34;       // how far off the left edge a front begins

export const POKE_PX = 150;      // radius of the pointer's inversion

export const GAP_INK = '#120d16';

/** [top, left, right] — the three faces of the cube, before rotation. */
export const PALETTES = [
  ['#f4e3bd', '#d4553a', '#59203f'],
  ['#dff5ec', '#2f9c95', '#123b3f'],
  ['#e9ff70', '#7b2ff7', '#2d1b4e'],
  ['#ffd98a', '#e0633f', '#2b2340'],
];

// The picture at t + GAP_SEC is the picture at t with every generation one
// higher, so the loop closes once both the tone rotation and the palette index
// have come back round. 3 and 4 are coprime, which is the point.
export const LOOP_SEC = 3 * PALETTES.length * GAP_SEC;

/** Hexagon vertex index triples making the top, left and right rhombi. */
export const FACES = [
  [5, 0, 1],
  [3, 4, 5],
  [1, 2, 3],
];
