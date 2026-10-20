// How finely the canvases are drawn, in one place.
//
// A retina screen asks for 2 device pixels per CSS pixel, which is 4x the
// dots to fill. Every effect redraws its whole canvas each frame, and with
// two or three cards live during a scroll that is what misses the 16.7ms
// budget: measured while scrolling the feed, 23% of frames were dropped at
// 2, against 3% at 1.5, 1% at 1.25 and none at 1.
//
// 1.5 is the knee of that curve. It is still above 1, so diagonals and type
// keep their smoothing; it just stops the heaviest cards from painting four
// dots where two and a quarter will do.
//
// This was written out in sixteen separate engines before it lived here. If
// you want to judge the softness for yourself, change the one number.
export const MAX_DPR = 1.5;

/** Device pixels per CSS pixel for a canvas backing store, capped. */
export function deviceRatio() {
  return Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, MAX_DPR);
}
