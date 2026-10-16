// Like — a like button where the reaction is a burst of confetti that
// gathers itself back into the heart.
//
// Rebuilt from the reference recording, measured at 30fps. The reference
// bursts a cluster of little characters out of the heart; here the cluster
// is confetti, but every curve is the reference's own:
//
//   press      the outline heart shrinks to 0.75 over four frames, a cubic
//              ease-in, so it is pulled in rather than faded.
//   burst      the cluster appears at 0.40 of its full spread, is at 0.82
//              two frames later, creeps to full by half a second, then is
//              drawn back in, accelerating, to half spread at 0.77s.
//   land       on the very next frame the filled heart is there at 1.53x
//              and settles to 1 by multiplying its excess by ~0.55 a frame
//              (1.53, 1.28, 1.14, 1.06, 1.02, 1.00). No overshoot below 1.
//   hold       the filled heart stays for HOLD seconds, then cuts back to
//              the outline on its own, ready to be pressed again.
//   unlike     pressing during the hold cuts back early. No transition.
//
// The burst is ONE number, the cluster's spread, read from that table. Every
// piece of confetti has a home offset from the heart's centre and sits at
// home × spread, so the whole cloud breathes out and in as one body, which
// is why it reads as the heart reacting rather than as particles flying
// about. Each piece spins and flutters on its own while it is out — the
// flutter is a cosine on its height, which is a flat piece turning in 3D —
// and that is the only per-piece motion there is.
//
// Nothing starts by itself: press the card to like; it resets after the hold.
// Every length is a fraction of card height.

export const GROUND = '#f2f2f2';
export const PINK = '#fc157c';      // the filled heart, sampled
export const OUTLINE = '#bcbcbc';   // the empty heart, sampled

// The confetti takes the reference characters' own colours.
export const CONFETTI = ['#fc157c', '#0a84ff', '#9452fb', '#ff6302', '#fc157c', '#0a84ff', '#747474'];
export const PIECES = 90;

export const HEART_W = 0.16;        // heart width, of card height
export const STROKE = 0.06;         // outline stroke, of heart width
export const SPREAD = 0.46;         // furthest home offset, of card height

export const FPS = 30;              // the tables below are one entry a frame

// The outline heart being pulled in on press.
export const PRESS = [1, 0.99, 0.965, 0.91, 0.75];

// The cluster's spread, frame by frame, from first appearance to the frame
// before the filled heart lands.
export const BURST = [
  0.4, 0.72, 0.82, 0.85, 0.89, 0.913, 0.928, 0.94, 0.952, 0.962, 0.971, 0.98,
  0.99, 0.996, 1, 1, 0.994, 0.979, 0.958, 0.921, 0.865, 0.754, 0.509,
];

// The filled heart landing: excess over 1 multiplied by this each frame.
export const LAND_FROM = 1.53;
export const LAND_DECAY = 0.55;

// How long the filled heart stays before reverting to the outline.
export const HOLD = 4;
