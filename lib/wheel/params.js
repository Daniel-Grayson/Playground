// Wheel — a ring of words fanned out round a centre off the left edge, like
// the spokes of a dial, built from the user's reference frame.
//
// Every word is a spoke: set along its own radius, starting at the ring's
// inner edge and reading outward, so at three o'clock it is level and above
// and below it tilts with the ring. Words are evenly spaced in angle. A few
// words on the ring are marks — larger and in the accent colour — spaced
// round it at a fixed interval, so as the ring turns they come by on a beat.
//
// The ring is a wheel with mass. It drifts slowly on its own; moving the
// pointer up or down over the card flicks it, the pointer's vertical speed
// becoming angular velocity, and friction brings it back to the drift. The
// angle is one number accumulated from that velocity, and every word reads
// its position from it — no word has state of its own.
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
// Every MARK_EVERY-th word is a mark, set large in the accent.
export const MARK_EVERY = 7;

// Geometry, measured off the frame (828 wide).
export const CENTER_X = 130 / 828;  // the ring's centre, off to the left
export const CENTER_Y = 0.5;        // of card height
export const RADIUS = 385 / 828;    // inner edge of the ordinary words
export const MARK_RADIUS = 428 / 828; // marks sit a little further out
export const SIZE = 19 / 828;       // ordinary word, font size
export const MARK_SIZE = 33 / 828;  // marks

// Motion.
export const DRIFT = 0.035;         // rad/s on its own
export const FLICK = 1.6;           // rad/s per card-height/s of pointer speed
export const FRICTION_HALF = 0.5;   // s, half-life of extra spin
export const MAX_SPIN = 6;          // rad/s cap

export const FONT_STACK =
  "'PP Mori', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
