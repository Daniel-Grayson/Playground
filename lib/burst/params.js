// Burst — a ring of stepped rays around an empty centre, built from the
// user's own ray (the Figma frame and the single ray it is made of).
//
// The ray is the user's SVG, read as a profile rather than drawn as a path:
// three bars end to end, each a third of the ray, stepping down in width —
// a thick outer bar, a medium one, and a hairline needle that does the
// pointing. Measured off that path (60 units long), the widths are, from
// the outer end: 6.8 → 5.2, then 2.9 → 2.0, then 0.4 → 0.23. Every ray on
// the card is that one profile at its own length, so the burst is one
// drawing repeated, which is what makes it read as designed rather than
// as random speed lines.
//
// How it moves — two things, both read from the pointer:
//
//   focus   the empty centre is a point, not a place. It is damped toward
//           the pointer (clamped near the middle), and every ray is
//           re-aimed at it from a fixed anchor far outside the card, so the
//           whole burst turns to look at you. Rays on the near side get
//           shorter and rays on the far side longer, for free, because
//           their anchors do not move.
//   pulse   a single bump runs around the ring and each ray it passes
//           thrusts inward, needle first. The pulse's speed and depth are
//           one damped "energy" number that pointer movement pumps and time
//           drains, so stillness gives a slow, shallow sweep and a flick
//           sends it whipping round.
//
// There is no per-ray animation state: a ray's whole pose is a function of
// the focus, the energy and the pulse's phase. Every length is a fraction
// of card height.

export const GROUND = '#231506';   // sampled from the frame
export const RAY = '#e68d33';      // the SVG's own fill

export const RAYS = 46;
export const HOLE = 0.25;          // inner radius of the burst
export const HOLE_JITTER = 0.025;  // per-ray variation, so the edge is drawn
export const NEEDLE = 0.19;        // needle length, measured off the frame
export const MEDIUM = 0.25;        // medium bar length; the thick bar runs off the card
export const SEGMENT_JITTER = 0.2; // per-ray variation in both lengths

// The profile, from the outer end in: [outer, inner] width of each bar.
// The SVG's own ratios (6.8 → 5.2, 2.9 → 2.0, 0.4 → 0.23 in a 60-unit ray)
// scaled so the thick bar matches the frame, ~0.05 of its height.
const K = 0.05 / 6.8;
export const PROFILE = [
  [6.8 * K, 5.2 * K],
  [2.9 * K, 2.0 * K],
  [0.4 * K, 0.3 * K],
];

// Focus.
export const FOCUS_REACH = 0.22;   // how far the centre may follow, of height
export const FOCUS_HALF = 0.12;    // s, damping half-life

// Pulse.
export const PULSE_SHARP = 10;     // power on the cosine: how narrow the bump is
export const PULSE_IDLE = 0.35;    // rev/s with no movement
export const PULSE_FAST = 2.2;     // rev/s at full energy
export const THRUST_IDLE = 0.05;   // inward travel at rest, of height
export const THRUST_FAST = 0.13;   // at full energy
export const ENERGY_GAIN = 0.9;    // energy per card-height of pointer travel
export const ENERGY_HALF = 0.45;   // s, how fast it drains
