// Leader — every number the piece runs on.
//
// The whole effect is a handful of global ramps plus four constants per
// letter. No spring, no physics, no blur, no gradient.
//
// The subject is an academy leader: the countdown spliced to the head of a
// reel so a projectionist can find the first frame of picture. It is the
// reason the mechanism exists rather than decoration applied to it — a
// leader numeral is supposed to arrive, hold just long enough to be read,
// then rush the lens and overrun the frame, because the next one is already
// coming. The sequence therefore runs in order and never shuffles: a
// countdown that picks its own numbers at random is not a countdown.
//
// Stock changes on every frame of the count, dark ground to light and back,
// which is what a leader does on a screen — two colours a card, a new pair
// each number.

export const FPS = 30;

export const HOLD_TICKS = 10;

// Entrance
export const ENTER_TICKS = 14;
export const ENTER_STAGGER = 3;
export const ENTER_RISE = 1.3;
export const ENTER_TURN = 95;
// The turn lags the drop: on the same progress a letter would finish turning
// above the top edge, where none of it is visible.
export const TURN_LAG = 2.5;

const SHIFT = ENTER_TICKS + ENTER_STAGGER;

export const LEAD_START = 9 + SHIFT;
export const LEAD_TICKS = 10;

export const ZOOM_START = 12 + SHIFT;
export const ZOOM_TICKS = 22;

// The exit starts before the zoom has finished, so no dead beat at peak.
export const ESCAPE_START = ZOOM_START + 18;
export const ESCAPE_TICKS = 15;

export const CYCLE_TICKS = ESCAPE_START + ESCAPE_TICKS;

// Hangs for its first third, snaps through the middle, overshoots ~6% and
// settles. No cubic-bezier gives this shape.
export const SCALE_TABLE = [
  0.0, 0.008, 0.02, 0.04, 0.075, 0.14, 0.29, 0.56, 0.8, 0.94, 1.02, 1.058,
  1.045, 1.022, 1.006, 1.0,
];

export const ROT_TABLE = [
  0.0, 0.0, 0.08, 0.269, 0.461, 0.613, 0.715, 0.804, 0.865, 0.918, 0.941,
  0.968, 0.99, 1.0,
];

// Flattened to one entry: the line-gap punch is off. sample() must survive a
// single-entry table — a naive lerp reads past the end and returns NaN.
export const LEAD_TABLE = [1.0];
export const LEAD_PIVOT = 0.81;
export const LEAD_REST = 1.0;

export const ENTER_TABLE = [
  0.0, 0.021, 0.052, 0.104, 0.196, 0.372, 0.632, 0.826, 0.951, 1.021, 1.043,
  1.032, 1.013, 1.0,
];

export const FALL_TABLE = [
  0.0, 0.01, 0.022, 0.036, 0.057, 0.085, 0.122, 0.169, 0.226, 0.302, 0.407,
  0.555, 0.778, 1.0,
];

// 2.2x floods a wide card. At 3x the crop holds no whole letter and the peak
// becomes texture rather than type.
export const PEAK_SCALE = 2.2;

// Heavy-tailed, not uniform: most letters barely move, one or two go wild.
export const SPIN_MAX = 95;
export const SPIN_TAIL = 2.6;
export const ESCAPE_SPIN_MAX = 130;
export const TUMBLE_MAX = 200;

export const EDGE_CULL = 0.02;

export const FALL_SPREAD = 0.16;

export const DEPTH_SPREAD = 0.08;
export const DEPTH_AT_REST = 0.35;

export const FLOOD_SQUEEZE = -0.1;

// A one-way slide reads as the word drifting off centre, not as a camera move.
export const FOCUS_DRIFT = 0;

export const SMEAR_STEPS = 3;
export const SMEAR_MIN_SPEED = 0.018;
export const SMEAR_REACH = 0.85;

export const PULL = 0.055;
export const PULL_EASE = 0.13;
export const HOLD_STRETCH = 34;

// The body face at its lighter weight. Asking for a weight the family does
// not ship makes the browser synthesise a bold by smearing stems, which at
// 2.2x is very visible mush.
export const FONT_STACK =
  "'PP Mori', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
export const FONT_WEIGHT = 600;

export const PITCH_OVER_CAP = 1.084;

export const TRACK_REST = -0.035;
export const TRACK_ZOOM = -0.062;

export const TARGET_WIDTH = 0.68;
export const MAX_CAP = 0.3;
// A single numeral is not a lockup and must not be set like one: a leader
// count fills its frame, and at the two-line ceiling it reads as a caption.
export const MAX_CAP_SOLO = 0.56;
export const TARGET_WIDTH_SOLO = 0.3;

// The leader's own language: a head card, then the count. Nothing is
// authored — these are the words and numerals a leader actually carries,
// which is why the piece has no wit to borrow.
//
// Two colours per card and a different pair on every number. Grounds
// alternate dark and light through the count so the stock still flashes the
// way a leader does on a screen, but the hue moves each time: a reel timed
// for colour runs its head through stocks like these, and eight repeats of
// black and bone is a count with no variety in it at all.
export const PRESETS = [
  { lines: ['Picture', 'Start'], bg: '#e7e2d4', ink: '#17150f', spin: 0.55 },
  { lines: ['8'], bg: '#1b2a6b', ink: '#f2e4c4', spin: 1.0 },
  { lines: ['7'], bg: '#e8d9b0', ink: '#8c1f16', spin: 0.85 },
  { lines: ['6'], bg: '#123f33', ink: '#f0e3bd', spin: 1.15 },
  { lines: ['5'], bg: '#f0e3bd', ink: '#2a1f6b', spin: 0.7 },
  { lines: ['4'], bg: '#7a1b2e', ink: '#edd9a8', spin: 1.3 },
  { lines: ['3'], bg: '#e3dcc8', ink: '#16564d', spin: 0.9 },
  { lines: ['2'], bg: '#2b1a3d', ink: '#e9c86a', spin: 1.1 },
];

/** Read a sampled table at a fractional index. Safe for a one-entry table. */
export function sample(table, u) {
  if (!(u > 0)) return table[0];
  if (u >= 1) return table[table.length - 1];
  if (table.length < 2) return table[0];
  const x = u * (table.length - 1);
  const i = Math.floor(x);
  return table[i] + (table[i + 1] - table[i]) * (x - i);
}
