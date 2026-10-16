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
// The rays are evenly spaced round a true circle, every one the same, and
// they move in unison — the ring is one body, not forty-six. Two motions:
//
//   breath  every ray thrusts in toward the centre and draws back out
//           together, on one cosine, so the empty circle closes and opens
//           like an iris.
//   turn    the whole ring rotates slowly about its centre.
//
// Pointer movement pumps one damped "energy" number that time drains; the
// breath gets faster and deeper and the turn quicker with it, and both
// settle back when the pointer stops. Every ray reads the same three
// numbers, so they cannot fall out of step. Every length is a fraction of
// card height.

export const GROUND = '#231506';   // sampled from the frame
export const RAY = '#e68d33';      // the SVG's own fill

export const RAYS = 46;
export const HOLE = 0.25;          // inner radius of the burst
export const NEEDLE = 0.19;        // needle length, measured off the frame
export const MEDIUM = 0.25;        // medium bar length; the thick bar runs off the card

// The profile, from the outer end in: [outer, inner] width of each bar.
// The SVG's own ratios (6.8 → 5.2, 2.9 → 2.0, 0.4 → 0.23 in a 60-unit ray)
// scaled so the thick bar matches the frame, ~0.05 of its height.
const K = 0.05 / 6.8;
export const PROFILE = [
  [6.8 * K, 5.2 * K],
  [2.9 * K, 2.0 * K],
  [0.4 * K, 0.3 * K],
];

// Breath: inward travel of every ray, and its rate.
export const BREATH_IDLE = 0.35;   // breaths per second at rest
export const BREATH_FAST = 1.6;    // at full energy
export const THRUST_IDLE = 0.035;  // how far in, of height, at rest
export const THRUST_FAST = 0.1;    // at full energy

// Turn: the whole ring's rotation.
export const TURN_IDLE = 0.012;    // revolutions per second at rest
export const TURN_FAST = 0.12;     // at full energy

export const ENERGY_GAIN = 0.9;    // energy per card-height of pointer travel
export const ENERGY_HALF = 0.45;   // s, how fast it drains
