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

export const PANEL = '#131416';
export const INK = '#e8e4da';

// Illumination.
export const DIM = 0.3;           // floor: an unlit label is grey, not gone
export const REACH = 0.42;        // half-brightness radius, in card heights
export const DAMP_HALF = 0.055;   // s, how fast the lamp reaches its target

// Layout, all in card heights.
export const MARK_LEFT = 0.13;
// Centred: (1 - MARK_H) / 2, so the bar sits on the strip's own axis.
export const MARK_TOP = 0.33;
export const MARK_H = 0.42;
export const MARK_GAP = 0.55;     // mark to first label
export const LABEL_GAP = 0.34;    // label to label
export const CAP = 0.19;          // label cap height
// Sized past what fits on purpose: the fit-to-width in the engine then takes
// the whole bar down by one factor, so it spans the card the way a real bar
// spans its container instead of huddling in the corner.
export const MARK_PAD = 0.06;     // slack around the mark that still counts as over it

export const LABELS = ['Home', 'Works'];

export const FONT_STACK =
  "'PP Mori', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
export const FONT_WEIGHT = 400;

// The mark: the horse from `horse.svg` in this folder, supplied by the user
// from Figma and rasterised to a grid. Blocky on purpose — a bitmap is what
// lets the light cross it pixel by pixel, and a smooth outline would light
// all at once and lose the whole point of the piece.
//
// Four frames of a prance, made by rocking the one silhouette about its hind
// hooves rather than by swapping drawings. The user supplied four horses, but
// they are four different illustrations rather than one horse in four
// positions — their silhouettes overlap only about half, so cutting between
// them reads as four horses flickering instead of one horse moving. Rocking a
// single pose keeps it the same animal. Row 19 is the ground in every frame
// and the hind hooves never leave it; what rises is the front.
export const HORSE = [
  [
    '............................',
    '.....##.....................',
    '...#####....................',
    '...######...................',
    '...#######..................',
    '...#######..................',
    '...########.................',
    '...#.############...#.......',
    '.....#################......',
    '.....##################.....',
    '.....##############.####....',
    '...################..###....',
    '..###.....#########..###....',
    '.#..#.........####....####..',
    '##..##.........####....###..',
    '#..............##.##....##..',
    '...............##.#.........',
    '...............#..#.........',
    '..............#...#.........',
    '.............#...#..........',
  ],
  [
    '............................',
    '....#####...................',
    '....#####...................',
    '...#######..................',
    '...#######..................',
    '...#########................',
    '...##.######................',
    '......############..#.......',
    '......#################.....',
    '.....##################.....',
    '...################..###....',
    '..####..###########..###....',
    '.##.#.........#####...###...',
    '.#..##.........####...###...',
    '...............####....####.',
    '...............##.##....##..',
    '...............##..#........',
    '...............#..#.........',
    '.............##...#.........',
    '.................#..........',
  ],
  [
    '....#.###...................',
    '....######..................',
    '....######..................',
    '....#######.................',
    '....#######.................',
    '....########................',
    '....#.#########.............',
    '......#############..#......',
    '......#################.....',
    '....####################....',
    '...#################.###....',
    '..#........#########..###...',
    '.#...#.........####...###...',
    '.#....#........####...###...',
    '...............####....####.',
    '................#.##....##..',
    '...............#...#........',
    '..............##............',
    '.............#....#.........',
    '.................#..........',
  ],
  [
    '............................',
    '....#####...................',
    '....#####...................',
    '...#######..................',
    '...#######..................',
    '...#########................',
    '...##.######................',
    '......############..#.......',
    '......#################.....',
    '.....##################.....',
    '...################..###....',
    '..####..###########..###....',
    '.##.#.........#####...###...',
    '.#..##.........####...###...',
    '...............####....####.',
    '...............##.##....##..',
    '...............##..#........',
    '...............#..#.........',
    '.............##...#.........',
    '.................#..........',
  ],
];

export const PRANCE_FPS = 9;      // the stride's own frame rate, not the card's

/** Where the lamp sits with no pointer, in 0..1 of the card. */
export function idleAt(t) {
  return {
    x: 0.48 + 0.44 * Math.sin(t * 0.23) + 0.05 * Math.sin(t * 0.61),
    y: 0.4 + 0.3 * Math.sin(t * 0.37 + 1.1) + 0.04 * Math.cos(t * 0.83),
  };
}
