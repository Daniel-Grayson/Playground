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
export const MARK_H = 0.16;
export const MARK_GAP = 0.22;     // mark to first label
export const LABEL_GAP = 0.14;    // label to label
export const CAP = 0.047;         // label cap height
// Sized past what fits on purpose: the fit-to-width in the engine then takes
// the whole bar down by one factor, so it spans the panel the way a real bar
// spans its container instead of huddling in the corner.
export const MARK_PAD = 0.05;     // slack around the mark that still counts as over it

export const LABELS = ['Home', 'Works'];

export const FONT_STACK =
  "'PP Mori', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
export const FONT_WEIGHT = 400;

// The mark is drawn by `figure.js`: the user's own artwork for everything
// above the legs, with jointed legs built underneath it so it can gallop.
// `horse.svg` in this folder is that artwork's source.
//
// The mark is drawn at this many rows for the horse's own height and then
// scaled up with smoothing off, so it reads as pixel art while the legs
// underneath it are real geometry swinging about real joints. Rasterising
// the animation rather than the artwork is what lets it be both: a bitmap
// of a fixed pose could never have run.
export const PIX_ROWS = 30;
// Room in the buffer for legs that swing outside the artwork's own box.
export const PIX_MARGIN = { l: 5, r: 4, t: 5, b: 4 };

export const RUN_HZ = 2.5;        // strides per second

/** Where the lamp sits with no pointer, in 0..1 of the card. It roams the
 *  panel rather than the whole card: there is nothing to light on the page. */
export function idleAt(t) {
  return {
    x: 0.62 + 0.3 * Math.sin(t * 0.23) + 0.04 * Math.sin(t * 0.61),
    y: 0.36 + 0.22 * Math.sin(t * 0.37 + 1.1) + 0.03 * Math.cos(t * 0.83),
  };
}
