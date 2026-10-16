// Flip — a sticker flipbook. One sticker at a time, centred on a dark
// ground, cutting to the next on a fixed beat.
//
// Measured off the reference recording (60fps capture): every sticker holds
// for 25–27 frames, so ~0.42s, and the change is a hard cut — no fade, no
// scale, no slide, not one in-between frame. The cut is the whole effect: a
// flipbook reads as a beat precisely because nothing eases, and each sticker
// is drawn at its own tilt so the sequence jumps about the way a hand-cut
// stack does without anything actually moving.
//
// The pointer sets the beat. With no pointer the book runs at the
// reference's own rate; across the card the beat follows the pointer's
// horizontal position, from a slow leaf-through at the left edge to a fast
// riffle at the right, so the same mechanism is a slideshow or a flicker
// depending on where you hold it. Cuts are still hard at every speed.
//
// Every length is a fraction of card height.

export const GROUND = '#110000';   // the reference's background, sampled

// The stickers, in order. Drop SVGs or PNGs (transparent, with their own
// die-cut border) into public/stickers/ and list them here; they are drawn
// in this order and looped. Until a file exists, its slot shows a
// placeholder sticker so the piece still runs.
export const STICKERS = [
  '/stickers/pizza_5.svg',
  '/stickers/pizza_6.svg',
  '/stickers/pizza_7.svg',
  '/stickers/pizza_8.svg',
  '/stickers/pizza_9.svg',
];

export const BOX = 0.38;           // each sticker's artboard fits a square this tall;
                                   // the art fills ~70% of it, so it lands at the
                                   // reference's 0.27 of the frame
export const HOLD = 0.42;          // s per sticker, with no pointer
export const HOLD_SLOW = 0.9;      // s per sticker, pointer at the left edge
export const HOLD_FAST = 0.08;     // s per sticker, pointer at the right edge

// Placeholder tilts, degrees, so the stand-ins jump about like the real set.
export const PLACEHOLDER_TILT = [-14, 8, -22, 16, -6];
