// Wheel — a ring of words fanned out round a centre off the left edge, like
// the spokes of a dial, built from the user's reference frame.
//
// Every word is a spoke: set along its own radius, starting at the ring's
// inner edge and reading outward, so at three o'clock it is level and above
// and below it tilts with the ring. Words are evenly spaced in angle, and
// all of them are small and white.
//
// The ring turns steadily on its own, and hovering never moves it. To spin
// it you take hold: press and the ring turns with the hand, by however far
// the pointer goes round its centre; let go and it keeps the speed it was
// moving at, which friction bleeds back to its own pace. The word under the pointer
// grows and turns to the accent — the frame's large orange words — stepping
// a little further out as it does, and settles back once the pointer leaves
// it. The hit test is done in the ring's own polar coordinates: the
// pointer's angle picks the nearest spoke and its radius has to fall along
// that word.
//
// Every length is a fraction of card WIDTH: the ring is sized to the card's
// width so it reads the same whatever the height.

export const GROUND = '#000000';
export const INK = '#ffffff';
export const ACCENT = '#f17551';   // sampled from the frame

export const WORDS = [
  'Fibroscan', 'Aminotransferase', 'DEXA scan', 'Gamma-GT', 'Full body MRI',
  'Haematocrit', 'Fibroscan', 'Haematocrit', 'Apolipoprotein B', 'Gamma-GT',
  'Monocytes', 'Full body MRI', 'Apolipoprotein B', 'Fibroscan', 'Haematocrit',
  'Full body MRI', 'Gamma-GT', 'Aminotransferase', 'Monocytes', 'Fibroscan',
  'Apolipoprotein B', 'DEXA scan', 'Gamma-GT', 'Haematocrit', 'Monocytes',
  'Apolipoprotein B', 'Fibroscan', 'Full body MRI', 'Gamma-GT', 'Apolipoprotein B',
  'Monocytes', 'DEXA scan', 'MONOCYTES', 'Aminotransferase', 'Fibroscan',
  'Monocytes', 'Gamma-GT', 'Full body MRI', 'Fibroscan', 'Apolipoprotein B',
  'Haematocrit', 'DEXA scan', 'Aminotransferase', 'Full body MRI', 'Gamma-GT',
  'Monocytes', 'Haematocrit', 'Fibroscan', 'Apolipoprotein B', 'Gamma-GT',
  'Full body MRI', 'Monocytes', 'DEXA scan', 'Haematocrit', 'Fibroscan',
  'Aminotransferase',
];

// Geometry, measured off the frame (828 wide).
export const CENTER_X = 130 / 828;  // the ring's centre, off to the left
export const CENTER_Y = 0.5;        // of card height
export const RADIUS = 385 / 828;    // inner edge of the ordinary words
export const MARK_RADIUS = 428 / 828; // a hovered word steps a little further out
export const SIZE = 19 / 828;       // ordinary word, font size
export const MARK_SIZE = 33 / 828;  // a hovered word

// Motion.
export const DRIFT = 0.16;          // rad/s: the ring's own steady turn
export const FRICTION_HALF = 0.5;   // s, half-life of extra spin
export const MAX_SPIN = 6;          // rad/s cap

// A word lighting up under the pointer, and settling back once it leaves.
export const HOVER_UP = 0.06;       // s, half-life
export const HOVER_DOWN = 0.25;     // s, half-life

export const FONT_STACK =
  "'PP Mori', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
