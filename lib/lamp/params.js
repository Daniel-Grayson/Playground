// Lamp — one light, and every mark on the panel samples it.
//
// A navigation bar where the pointer is a lamp held over the surface. There
// is no hover state, no active item, no enter and leave transition and no
// per-element tween anywhere in the piece. There is one scalar field —
// illumination — and each mark reads it at its own position:
//
//   b(p) = DIM + (1 - DIM) / (1 + (|p - lamp| / REACH)^2)
//
// That is the inverse-square law, which is what a real lamp does, and it is
// the whole picture. A label near the light is full ink, a label away from it
// settles to DIM rather than to nothing, which is why the bar still reads as
// a bar when the light is elsewhere instead of looking half-loaded.
//
// Sampling per MARK rather than per element is what makes it worth building.
// Each glyph of a word samples at its own centre, so a word lights letter by
// letter as the lamp crosses it and the far end of a long word is still dim
// while the near end is bright — which is a thing a hover state cannot do at
// any price. The horse is a bitmap for the same reason: every one of its
// pixels is its own sample, so the light crawls across the mark rather than
// switching it on. Nothing is drawn twice and nothing is composited; the cost
// is one fill per mark.
//
// The horse prances while the lamp is over it. The pose is data, not an
// easing function: four drawn frames, back hooves planted on the same row in
// every one of them so the animation is weight shifting rather than the whole
// mark bouncing, and the lift is carried by the front pair and the head. Once
// started it always finishes its stride — leaving the mark does not stop the
// horse mid-air, it stops at the frame where all four feet are down, which is
// the only frame a standing horse can be in. That is why there is no settle
// tween: the cycle's own end IS the rest pose.
//
// The piece keeps two pieces of state, the lamp's position and the stride's
// phase. Neither is accumulation in the sense that matters: a damped follower
// converges to its target from wherever it happens to be, and the stride is a
// phase modulo its own length, so a resize, a tab-resume and a pointer that
// jumps all heal themselves within a few frames instead of drifting. The same
// damping makes the handoff between pointer and idle path a glide rather than
// a jump, so the piece needs no transition code for that either.
//
// Every length below is a fraction of card height, never a pixel count: the
// same bar is ~620px tall in the feed column and ~165px on a phone.

// Measured off the reference screenshot: the page grey, the panel, and the
// panel's own corner. The panel is inset from the top left and runs off the
// right and bottom edges, so only its top-left corner is ever drawn.
export const PAGE = '#eeeef0';
export const PANEL = '#101013';
export const INK = '#f1f0ed';

export const PANEL_LEFT = 0.233;   // of card WIDTH
export const PANEL_TOP = 0.208;    // of card HEIGHT
export const PANEL_RADIUS = 0.07;  // of card height

// Illumination.
export const DIM = 0.3;           // floor: an unlit label is grey, not gone
export const REACH = 0.42;        // half-brightness radius, in card heights
export const DAMP_HALF = 0.055;   // s, how fast the lamp reaches its target

// Layout, all in card heights, and all measured from the panel's own corner
// rather than the card's: the bar belongs to the panel, and sits at the top
// of it the way a real one does.
export const MARK_LEFT = 0.1;     // inset from the panel's left edge
export const MARK_TOP = 0.1;      // inset from the panel's top edge
export const MARK_H = 0.25;
export const MARK_GAP = 0.22;     // mark to first label
export const LABEL_GAP = 0.14;    // label to label
export const CAP = 0.065;         // label cap height
// Sized past what fits on purpose: the fit-to-width in the engine then takes
// the whole bar down by one factor, so it spans the panel the way a real bar
// spans its container instead of huddling in the corner.
export const MARK_PAD = 0.05;     // slack around the mark that still counts as over it

export const LABELS = ['Home', 'Works'];

export const FONT_STACK =
  "'PP Mori', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
export const FONT_WEIGHT = 400;

// The mark: the horse from `horse.svg` in this folder, drawn as the vector
// path it actually is rather than rasterised to a grid.
//
// An earlier version made it a bitmap, on the reasoning that the light had
// to cross it pixel by pixel. That was wrong. Filling the real path with a
// radial gradient centred on the lamp gives a CONTINUOUS falloff across the
// silhouette, which is closer to the inverse-square law the piece runs on
// than sampling a 28x20 grid ever was — a grid is that same field measured
// at 560 points and then rounded. The glyphs still sample one point each,
// because a glyph is a separate mark; the horse is one shape, so it gets the
// field itself.
export const HORSE_PATH = 'M23.8305 0C30.8902 0.323906 33.9159 3.54493 37.343 9.35344C38.0895 10.6184 39.806 12.6844 40.7529 13.9598C39.5784 13.2804 37.8989 11.9557 36.7594 11.1045C39.6295 15.2695 43.0622 16.6664 47.558 13.9573C46.8647 15.0415 46.3643 16.128 45.8027 17.2821C44.8981 17.7905 44.1321 18.225 43.2633 18.8067L43.2448 19.1295C48.9565 23.6719 63.9586 15.9624 74.2758 24.5041C84.5648 17.7122 90.6351 23.0956 95.2219 32.7366C99 40.676 98.5992 44.8392 109.488 42.5177C108.546 43.0699 106.277 44.033 105.853 44.6899C106.713 45.135 109.863 43.7473 111.131 43.3788L111.237 43.6256C109.538 45.2944 103.964 47.3747 101.562 48.057L108.312 50.0977C108.225 50.1087 108.138 50.1185 108.052 50.1277C89.761 51.9656 93.1383 46.4109 83.332 33.8963C82.4484 32.7696 80.5289 30.1697 79.4531 29.3088L79.3242 29.2066C78.3094 28.4009 77.3227 28.1937 76.0852 27.8402C76.957 35.3494 76.8328 37.107 73.8305 43.6596C74.3297 45.2248 78.3164 48.6607 79.6664 49.7529C78.2695 54.2365 76.7367 60.4191 74.3953 64.5181C74.0742 65.0801 72.6797 66.0345 72.082 66.4517C71.1258 66.4627 68.925 66.6509 68.2805 66.2372C67.7883 62.7471 71.768 63.0675 73.0219 61.8616C74.7914 60.1608 75.1969 55.2316 75.2109 52.7796C73.7508 51.1863 72.4383 50.6229 70.5422 49.6205C67.9945 47.8366 67.125 46.4731 65.257 44.0501C66.007 46.7428 66.7266 49.4438 67.4156 52.1524C66.1688 55.7623 60.7875 59.7239 58.4039 63.0342C57.6734 64.0488 51.2949 65.6745 49.8506 64.9221L49.916 64.4109C51.1306 62.5955 56.0656 61.0444 58.0549 59.3873C63.6141 54.7573 62.9812 54.0853 60.2838 48.1685C58.6455 44.5744 58.9001 43.1238 56.1752 39.4514C50.3866 40.9819 44.4945 40.8286 38.8404 38.7856C37.7114 38.3777 36.0848 37.1124 35.4185 37.0512C35.1631 37.3833 34.8305 37.9317 34.3479 37.9291C32.8048 37.9209 31.2626 37.8459 29.7195 37.8197C26.7253 37.7487 23.7293 37.7913 20.7382 37.9477L18.8805 40.4684C19.3495 42.2065 20.0288 44.0238 20.6297 45.7329C24.806 43.7025 24.7451 44.8596 25.4691 48.9094C22.8244 48.4322 19.9137 47.6815 17.2948 47.3775C16.871 45.0089 16.0667 40.811 15.926 38.5756C10.6554 41.6871 6.95204 44.5261 5.19563 50.7696C3.54399 50.6941 1.66992 50.7253 0 50.7164C2.55305 45.4809 5.48907 42.4913 9.37852 38.303C13.1018 34.2938 16.4653 33.3448 21.6642 32.2685C20.8484 27.0267 21.3783 26.0869 21.8039 20.9252C21.8721 20.0974 21.3619 16.9052 21.203 15.9023C20.3866 17.3332 18.1727 20.1701 17.1045 21.4174L16.9481 24.8466C15.4702 24.7315 13.7979 24.5025 12.3087 24.3326C11.3093 19.4548 11.029 10.0814 12.6422 5.29454C11.7823 4.31251 9.92883 2.50828 10.2094 1.1993C11.0627 1.27828 11.7851 2.72016 12.874 3.02883C13.2225 2.55305 13.4571 1.22977 13.6071 0.583127L15.4313 3.79711C18.2838 1.04813 19.8232 0.258281 23.8305 0Z';
export const HORSE_VIEW = { w: 112, h: 67 };

// The hind hooves, as fractions of the viewBox: the prance rocks about them,
// measured off the artwork rather than guessed.
export const PIVOT = { x: 0.571, y: 0.993 };

// The horse RUNS, on the spot. Its legs are drawn in one fixed pose inside a
// single merged path, so there is no leg to grab — but the mark is a flat
// silhouette in one colour, which means it can be cut and reassembled and
// the seams cannot be seen. The fore pair and the hind pair are each clipped
// out, rotated about their own joint, and the body is drawn back over the
// top, so any gap at the cut is covered by the belly that sits above it.
//
// All of this is in viewBox units, measured off the artwork by scanning the
// silhouette for where the legs separate from the body.
// Each leg is clipped on its own, and only BELOW the row where its pair
// stops overlapping — measured by scanning the silhouette for where one run
// of ink becomes two. That is what keeps the joint narrow: a piece rotated
// about a pivot opens a gap along its cut proportional to the cut's width,
// so cutting a whole chest swings a visible notch out of the shoulder while
// cutting one leg moves it by a fraction of a pixel. The body is drawn back
// over every cut afterwards, so the top of the gap is covered too.
//
// All in viewBox units of `horse.svg`, which is 112 x 67.
export const LEGS = [
  // Hind pair: one run of ink until y 45, and the boundary between the two
  // runs sits at x 66.5 — splitting anywhere else cuts a hoof in half and
  // sends the halves in opposite directions.
  { x0: 50, x1: 66.5, y: 45, px: 61, py: 45, phase: 0 },
  { x0: 66.5, x1: 86, y: 45, px: 72, py: 45, phase: 0.12 },
  // Fore pair: merged until y 40.
  { x0: -16, x1: 15, y: 40, px: 11, py: 40, phase: 0.5 },
  { x0: 15, x1: 30, y: 40, px: 19, py: 40, phase: 0.62 },
];

// The body, in rects that cover every cut from above.
export const BODY = [
  { x0: -16, x1: 112, y: 40 },   // down to the fore cut, everywhere
  { x0: 30, x1: 95, y: 45 },     // deeper over the hind cut
  { x0: 86, x1: 130, y: 67 },    // the tail, which never swings
];

// A gallop is the four legs out of phase, not two pairs alternating: the
// hind pair lands first and close together, the fore pair follows half a
// stride later. The body rises twice per stride, once on each pair, which
// is what sells running rather than scissoring.
// The mark is drawn at this many rows for the horse's own height and then
// scaled up with smoothing off, so it reads as pixel art while the legs
// underneath it are real geometry swinging about real joints. Rasterising
// the animation rather than the artwork is what lets it be both: a bitmap
// of a fixed pose could never have run.
export const PIX_ROWS = 20;
// Room in the buffer for legs that swing outside the artwork's own box.
export const PIX_MARGIN = { l: 10, r: 6, t: 4, b: 7 };

export const RUN_HZ = 2.5;        // strides per second
export const RUN_DEG = 15;        // how far a leg swings
export const BOB = 0.045;         // of mark height, at twice stride rate

/** Where the lamp sits with no pointer, in 0..1 of the card. It roams the
 *  panel rather than the whole card: there is nothing to light on the page. */
export function idleAt(t) {
  return {
    x: 0.62 + 0.3 * Math.sin(t * 0.23) + 0.04 * Math.sin(t * 0.61),
    y: 0.36 + 0.22 * Math.sin(t * 0.37 + 1.1) + 0.03 * Math.cos(t * 0.83),
  };
}
