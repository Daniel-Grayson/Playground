// Plate — a wet-plate photograph that develops wherever it is warm.
//
// Reference: the Red Dead Redemption 2 loading screen, studied frame by frame
// from a screen recording. What it actually does is not a reveal of a second
// picture. It starts as the photograph's own NEGATIVE — cool silver, tones
// flipped, the white cross on a black sky — and the positive spreads across it
// in soft smoky patches until the warm sepia print is all that is left. The
// boundary between the two is a wide grey haze, not a line.
//
// That haze is the mechanism, not a wipe laid on top of it.
//
//   neg(g) = negDark + (1 - g)(negLight - negDark)
//   pos(g) = posDark +      g (posLight - posDark)
//
// Blend them by a development amount d. The sum pos(g) + neg(g) loses its
// dependence on g exactly when both ramps span the same range per channel,
// posLight - posDark = negLight - negDark. With that one identity held, every
// pixel at d = 0.5 is the same colour whatever the photograph says there: the
// picture is not hidden at the boundary, it is absent. That is why the edge of
// a developing patch reads as smoke — it is the one place the plate has no
// image at all. NEG_LIGHT is derived below rather than chosen, so the identity
// cannot drift out of true when a colour is retuned.
//
// So the whole piece is one photograph and one number per place: d. Nothing
// is masked, cut out or crossfaded between two images. In practice d = 0 and
// d = 1 are pre-toned into two canvases and the frame composites the positive
// over the negative with d as its alpha — which is the same linear blend,
// done by the compositor instead of per pixel.
//
// d is driven by heat. A coarse grid, sized in rows of card height so a phone
// card and a desktop card get the same field, diffuses and cools every tick,
// and the pointer lays heat down along its whole path between ticks so a fast
// flick is a stroke rather than a row of dots. Heat becomes development
// through a threshold that a slowly moving smoke noise multiplies — multiplies,
// not adds, so where there is no heat there is no development however the
// noise swings, and the cold plate never blooms on its own. Development rises
// fast and falls slowly: the print comes up as soon as it is warm and lingers
// as it cools, which is what makes it read as a material rather than a cursor
// mask.
//
// When nobody is pointing, a heat source of its own drifts across the plate on
// a slow closed path — a pure function of time — and fades in over a second
// so taking the pointer away is a hand-off rather than a jump. On a phone that
// drift is the whole piece.
//
// This is the one piece in the vault besides Marble that cannot be a pure
// function of t: its state is the pointer's history. The field lives in grid
// cells rather than pixels, so a resize keeps it; ticks are fixed-step and
// capped per frame, so a tab-resume cools the plate instead of replaying a
// minute of physics.
//
// The photograph is Timothy O'Sullivan, "Sand Dunes, Carson Desert, Nevada",
// 1867 — his own darkroom wagon on the King Survey. Public domain.

export const PLATE_SRC = '/plate/carson-desert.jpg';

// Two tones each way. Sepia print; cool silver negative.
export const POS_DARK = [40, 28, 18];
export const POS_LIGHT = [232, 216, 184];
export const NEG_DARK = [12, 16, 26];
// Derived: equal span per channel is what makes d = 0.5 uniform (see above).
export const NEG_LIGHT = NEG_DARK.map((v, i) => v + POS_LIGHT[i] - POS_DARK[i]);

// Tone curve on the photograph's luminance: albumen prints are contrasty.
export const CONTRAST = 1.1;
export const GRAIN = 0.035;          // ± in luminance, per CSS px
export const VIGNETTE = 0.55;        // how dark the corners of the print go
export const VIGNETTE_WOBBLE = 0.18; // the plate's poured, uneven edge

// The heat field. Rows are fixed; columns follow the card's aspect.
export const GRID_ROWS = 56;
export const TICK_HZ = 60;
export const MAX_TICKS = 6;          // per frame; a resumed tab cools, it does not replay
export const DIFFUSE = 0.18;         // per tick, toward the 4-neighbour mean
export const COOL_HALF = 0.75;       // s, heat half-life

// The pointer's brush, as a fraction of card height.
export const BRUSH_R = 0.13;
export const BRUSH_HEAT = 9;         // per second at the brush centre

// Heat -> development.
export const DEV_LO = 0.18;
export const DEV_HI = 0.62;
export const SMOKE_SCALE = 0.19;     // noise cycles per grid row
export const SMOKE_OCTAVES = 4;
export const SMOKE_DRIFT = 0.12;     // rows per second the smoke moves
export const SMOKE_AMT = 1.25;       // multiplies heat by 1 ± this × the noise
export const RISE_HALF = 0.06;       // s
export const FALL_HALF = 0.55;       // s

// The idle drift.
export const IDLE_AFTER = 1.4;       // s without the pointer before it takes over
export const IDLE_FADE = 1.0;        // s to reach full strength
export const IDLE_HEAT = 0.7;        // fraction of the pointer's brush

/** Where the idle heat source sits at time t, in 0..1 card units. */
export function idleAt(t) {
  return {
    x: 0.5 + 0.34 * Math.sin(t * 0.21 + 0.6) + 0.06 * Math.sin(t * 0.53),
    y: 0.52 + 0.26 * Math.sin(t * 0.31 + 1.9) + 0.05 * Math.cos(t * 0.71),
  };
}
