// Transit — one mechanism: a line of text on an inked bar walking a
// breakpoint track, stamping its flat silhouette wherever it just was.
//
// The subject is a parcel moving through a customs hall: a waybill that
// picks up an impression at every station it stops at. That is what makes
// the residue literal rather than decorative — the trail the mechanism
// already leaves IS the stack of rubber stamps such a document accumulates,
// so the piece needs no reason invented for it.
//
// Each bar is the inked block and the text is the paper knocked out of it,
// which is how a solid rubber stamp actually prints. Ink is therefore the
// field colour, not a third hue.

export const TICK_MS = 50;      // 20fps
export const STEP = 2;          // 10Hz movement cadence
export const STAMP_TTL = 16;    // stamps vanish all at once, no fade

export const PARK_IN = 28;
export const PARK_OUT = 76;
export const PASS_END = 93;
export const PARK_FRAMES = 48;

// The incoming pass starts before the outgoing one ends; their interleaved
// trails ARE the colour flood. No separate transition code.
export const PASS_OVERLAP = 12;
export const FIELD_SWAP = 5;    // hard cut under the densest part of the flood

/**
 * A world is three hex colours plus four strings. Field and bar must be far
 * apart in BOTH hue and value — a low-contrast pairing reads as a stain
 * rather than as an impression — and the ink is the field knocked back out.
 *
 * The strings are a waybill's own language: route, consignment number, date
 * of entry, status. Nothing here is authored, which is the point.
 */
export const WORLDS = [
  {
    bg: '#cbb085', bar: '#4e2a7a', ink: '#cbb085',
    lines: ['PAR / LIS', 'AWB 057-4412', '14 JUN 1971', 'IN TRANSIT'],
  },
  {
    bg: '#e2d6b6', bar: '#a62b1e', ink: '#e2d6b6',
    lines: ['HKG / SFO', 'AWB 160-8830', '02 NOV 1968', 'CLEARED'],
  },
  {
    bg: '#c3bcab', bar: '#163a79', ink: '#c3bcab',
    lines: ['BUE / DKR', 'AWB 044-2719', '28 MAR 1974', 'HELD'],
  },
  {
    bg: '#1b1915', bar: '#ddd0ab', ink: '#1b1915',
    lines: ['YUL / KEF', 'AWB 112-6605', '09 SEP 1966', 'ON FORWARD'],
  },
  {
    bg: '#ddd2b0', bar: '#2c5a3c', ink: '#ddd2b0',
    lines: ['BOM / NBO', 'AWB 081-3340', '21 FEB 1979', 'EXAMINED'],
  },
];

export const HEADLINE = 71 / 600;

export const BAR_PAD_X = 10 / 600;
export const BAR_PAD_TOP = 11 / 600;
export const BAR_PAD_BOTTOM = 8 / 600;
export const BAR_RADIUS = 11 / 600;
export const BAR_STROKE = 16 / 600;

export const LINE_RIGHT_MARGIN = 24 / 600;

// Over-long lines are condensed into the room their own track leaves them,
// never set smaller: four type sizes read as a layout, not as one poster.
export const CONDENSE_MIN = 0.72;

export const FONT_STACK =
  "'PP Mori', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
export const FONT_WEIGHT = 600;

/**
 * The choreography is data, not an easing function. Inside every hop the
 * pacing is deliberately jagged and stop-start, and always axis-aligned:
 * slide, stop, drop, stop, slide. Smoothing this or fitting it to a cubic
 * is what kills the print-like snap.
 *
 * These four tracks are written for this piece, not traced from anything:
 * each line enters from a different edge of the hall, stops at two or three
 * stations on its way in — every stop is where a stamp lands — and leaves by
 * a different route than it arrived. All four are stationary from PARK_IN to
 * PARK_OUT, which is the only window in which the document can be read, and
 * the parked stack is deliberately ragged in x so the bars step rather than
 * align into a block.
 *
 * Coordinates are a square 600-unit space, letterboxed to the card height.
 * Frames are even because movement runs at STEP cadence; an odd keyframe is
 * sampled from its neighbours and quietly softens the stop it was meant to
 * make.
 */
export const TRACKS = [
  // In from the top, right, down, then back left onto the stack.
  [[2, 86, -130], [6, 86, 44], [8, 86, 44], [10, 196, 44], [12, 196, 44],
    [14, 196, 150], [16, 196, 150], [20, 86, 150], [28, 86, 150],
    [76, 86, 150], [80, 86, 92], [84, 232, 92], [86, 232, 92], [92, 232, -150]],

  // In from the left, up a step, left again, down to rest.
  [[8, -560, 236], [12, 150, 236], [14, 150, 236], [16, 150, 182],
    [20, 150, 182], [22, 58, 182], [26, 58, 236], [28, 58, 236],
    [76, 58, 236], [78, 58, 236], [82, 210, 236], [86, 210, 300],
    [88, 210, 300], [93, -580, 300]],

  // In from the right, up, left, and down onto the stack.
  [[4, 640, 322], [8, 240, 322], [10, 240, 322], [12, 240, 268],
    [16, 240, 268], [18, 104, 268], [22, 104, 268], [26, 104, 322],
    [28, 104, 322], [76, 104, 322], [80, 104, 268], [84, 36, 268],
    [88, 36, 268], [93, 660, 268]],

  // Up from the bottom, right, up, then left into place.
  [[6, 72, 620], [10, 72, 470], [14, 72, 470], [16, 188, 470], [18, 188, 470],
    [22, 188, 408], [26, 72, 408], [28, 72, 408], [76, 72, 408],
    [80, 72, 462], [82, 164, 462], [86, 164, 408], [90, 120, 408],
    [93, 120, 650]],
];
