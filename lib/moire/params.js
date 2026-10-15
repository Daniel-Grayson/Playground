// Moiré type — the word is never drawn.
//
// THE WHOLE PIECE IS ONE RULING AND A SECOND RULING THAT DISAGREES WITH IT.
// The field is ruled edge to edge with parallel lines. Inside the letterforms
// a second ruling is laid over the first, and the type exists only as the
// place where the two disagree. No glyph is ever filled or stroked: there is
// no ink in the shape of a letter anywhere in this piece.
//
// The two rulings disagree in three ways at once — angle, spacing and phase —
// because that is what moiré is. Rotation alone gives a clean texture change
// and reads as a stencil; adding a period difference is what throws the beat
// bands across the counters and makes the letterform shimmer rather than sit.
//
// EVERY DIVERGENCE IS THE SAME NUMBER. One global `d` scales the angle, the
// spacing ratio, the phase offset and each glyph's own tilt. That single
// decision is what buys the rest of the piece:
//
//   - The entrance and exit are free. The word does not fade in; it comes
//     into EXISTENCE as the rulings separate, and nothing on screen ever
//     changes opacity.
//   - At d = 0 the second ruling is identical to the first in every respect,
//     so the field is perfectly uniform and the word is not merely hidden but
//     absent. That is the instant the next word and the next palette swap in,
//     and the swap cannot be seen because there is nothing on screen to cut.
//
// So there is no transition code here, for the same reason there is none in
// a piece that derives its flood from an overlap: the scene change falls out
// of the mechanism. Any pair of worlds works, because the frame they cut on
// is the same frame for both — a flat field of parallel lines.
//
// TWO FLAT COLOURS AND NOTHING ELSE. No blur, no gradient, no fade, no
// texture. The only shape drawn anywhere in the piece is a straight line.

export const FPS = 30;

export const OPEN_TICKS = 13;
export const HOLD_TICKS = 34;
export const SHUT_TICKS = 11;
// Dead frames at the end, held at exactly zero divergence. Without them the
// curve only reaches zero at the instant the cycle wraps, so the last frame
// actually rendered still carries the old word at about 9% divergence and
// the colour cut lands on top of a faintly visible letterform. These two
// ticks are the empty frame the cut needs.
export const SHUT_HOLD = 2;
export const CYCLE_TICKS = OPEN_TICKS + HOLD_TICKS + SHUT_TICKS + SHUT_HOLD;

/**
 * Divergence on the way in. Hangs for its first third, snaps, overshoots and
 * settles — the word should SLAM into existence rather than resolve. Authored
 * as a sampled table because no cubic gives a hang this flat followed by a
 * slope this steep.
 */
export const OPEN_TABLE = [
  0.0, 0.006, 0.018, 0.042, 0.095, 0.21, 0.44, 0.72, 0.9, 1.0, 1.047, 1.028,
  1.008, 1.0,
];

/** And out. Faster than it came, with no overshoot: it is being switched off. */
export const SHUT_TABLE = [
  1.0, 0.995, 0.975, 0.93, 0.85, 0.72, 0.55, 0.37, 0.21, 0.09, 0.025, 0.0,
];

// Ruling, in the 600-unit square.
export const RULE_GAP = 11;
export const RULE_WIDTH = 4.6;

// Divergence at full open.
export const MAX_ANGLE = 24;        // degrees between the two rulings
export const SPACING_SPREAD = 0.22; // inner gap = gap * (1 + this * d)
export const PHASE_SPREAD = 0.55;   // in units of the gap

// Per-glyph tilt is heavy-tailed, not uniform: nearly every letter sits on
// the shared inner angle, so the one that does not reads as deliberate rather
// than as noise. It scales by d like everything else, or the field would not
// be uniform at the swap.
export const TILT_MAX = 15;
export const TILT_TAIL = 2.4;

// The beat bands crawl while the word is parked, so the hold is never static.
export const CRAWL = 0.38;

export const TARGET_WIDTH = 0.82;
export const MAX_CAP = 0.46;

// Set in the heavier of the two weights the family ships. This is the
// opposite call from a piece whose word grows enormous: here a glyph is a
// WINDOW onto a texture, and a wider stem shows more of the second ruling.
// Below about three rule lines per stem the angle stops reading and the word
// turns back into a stencil.
export const FONT_WEIGHT = 600;
export const FONT_STACK =
  "'PP Mori', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Each world is exactly two flat colours: the ground, and the rule. */
export const WORLDS = [
  { word: 'BEAT', bg: '#f3f1e9', rule: '#141210' },
  { word: 'PHASE', bg: '#130d0a', rule: '#ff3b1f' },
  { word: 'FRINGE', bg: '#e8e6dc', rule: '#0f2fd8' },
  { word: 'ALIAS', bg: '#07140f', rule: '#22e39a' },
  { word: 'RULE', bg: '#1b1b1b', rule: '#ffd21f' },
];

export function sample(table, u) {
  if (!(u > 0)) return table[0];
  if (u >= 1) return table[table.length - 1];
  if (table.length < 2) return table[0];
  const x = u * (table.length - 1);
  const i = Math.floor(x);
  return table[i] + (table[i + 1] - table[i]) * (x - i);
}

/** Divergence at a tick: 0 means the two rulings are the same ruling. */
export function divergenceAt(f) {
  if (f < OPEN_TICKS) return sample(OPEN_TABLE, f / OPEN_TICKS);
  if (f < OPEN_TICKS + HOLD_TICKS) return 1;
  const u = (f - OPEN_TICKS - HOLD_TICKS) / SHUT_TICKS;
  return u >= 1 ? 0 : sample(SHUT_TABLE, u);
}
