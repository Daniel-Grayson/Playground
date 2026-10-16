// Post — a sheet of city stamps, and the one you are over comes up off it.
//
// The look is a collector's album page: line-engraved stamps loose on a
// cream sheet, overlapping, each a little off square. Every stamp is two
// colours and only two — one ink and the paper it is printed on — which is
// how intaglio postage was actually made, and it is also why the sheet can
// carry eight hues without turning into a mess: no stamp ever mixes them.
//
// The engraving is not an image. Each scene is drawn once as a plain tone
// map (a sky gradient, a tower, a river, as greys) and then CUT: one screen
// of wavy horizontal lines whose width is the tone, a second diagonal screen
// that only comes in past half-tone, and a contour wherever the tone steps.
// That is the whole of line engraving — the engraver had one burin and
// varied only how wide each line was — so every shade on every stamp is the
// same line at a different width, and the landmarks read as engraved rather
// than as filtered photographs. The cut runs once per stamp per resize, not
// per frame.
//
// The interaction is the one thing you do with a loose stamp: pick it up.
// The reference this was built from drags; the page has no clicking, so here
// the stamp under the pointer lifts on its own — it grows a little, squares
// up, its shadow lengthens and softens, and it leans toward the pointer as if
// held at that point. Lifting a stamp puts it on top of the pile and it
// stays there when it settles, so moving across the sheet reshuffles it the
// way handling a real pile does. With no pointer the sheet is handled by
// itself: one stamp at a time, on a slow round.
//
// Each stamp's lift is a single damped number, 0 to 1, and everything about
// the lift — scale, squaring, lean, shadow — is read from it. There is no
// lift animation and no settle animation; there is a target and a follower.
//
// Every length is a fraction of card height.

export const PAPER = '#e9e4d8';          // the album sheet

// The stamps: city, the country line, the face value, ink, and which way up.
// Placement is in fractions of the card (x of width, y of height), and some
// run off the edge on purpose, as they do on a real sheet.
export const STAMPS = [
  { key: 'newyork', city: 'NEW YORK', country: 'U.S.A.', value: '8¢', ink: '#e0332b', shape: 'land', x: 0.29, y: 0.21, rot: -2.2 },
  { key: 'paris', city: 'PARIS', country: 'FRANCE', value: '30 F', ink: '#2f3fd0', shape: 'port', x: 0.61, y: 0.24, rot: 3 },
  { key: 'rio', city: 'RIO', country: 'BRASIL', value: '50 Cr', ink: '#0d9455', shape: 'port', x: 0.9, y: 0.2, rot: -3.5 },
  { key: 'tokyo', city: 'TOKYO', country: 'NIPPON', value: '¥10', ink: '#7b2fbf', shape: 'port', x: 0.085, y: 0.6, rot: 4 },
  { key: 'istanbul', city: 'İSTANBUL', country: 'TÜRKİYE', value: '15 Kr', ink: '#0f8a8f', shape: 'land', x: 0.45, y: 0.59, rot: -1.4 },
  { key: 'sydney', city: 'SYDNEY', country: 'AUSTRALIA', value: '5d', ink: '#e86a12', shape: 'land', x: 0.83, y: 0.55, rot: 2.2 },
  { key: 'london', city: 'LONDON', country: 'POSTAGE', value: '3d', ink: '#c2186b', shape: 'port', x: 0.25, y: 0.93, rot: -4 },
  { key: 'cairo', city: 'CAIRO', country: 'EGYPT', value: '10 M', ink: '#9a6a00', shape: 'land', x: 0.68, y: 0.87, rot: 1.6 },
];

// Stamp sizes, in card heights. British stamps famously carry no country
// name, which is why London's says only POSTAGE.
export const SIZE = {
  land: { w: 0.4, h: 0.3 },
  port: { w: 0.27, h: 0.36 },
};
export const STAMP_PAPER = '#f6f0e1';

// The stamp's own furniture, in units of its shorter side.
export const PERF_MARGIN = 0.075;  // paper outside the frame line
export const PERF_STEP = 0.058;    // hole spacing
export const PERF_R = 0.021;       // hole radius
export const FRAME_GAP = 0.03;     // frame line to picture
export const TOP_BAND = 0.13;      // city name
export const BOTTOM_BAND = 0.115;  // country and value

// The engraving: line period as a fraction of the picture's height. About
// thirty-five lines down a picture is what a real engraved stamp carries.
export const LINES = 35;
export const MIN_PERIOD = 2.4;     // device px; finer than this just greys out

// The lift.
export const LIFT_UP = 0.07;       // s, half-life rising
export const LIFT_DOWN = 0.12;     // s, half-life settling
export const LIFT_SCALE = 0.075;   // grows by this much when held
export const LIFT_SQUARE = 0.75;   // fraction of its tilt it loses when held
export const LIFT_LEAN = 0.07;     // drift toward the pointer, of the offset

// With no pointer: one stamp at a time, on a round.
export const IDLE_EVERY = 2.6;     // s between stamps
export const IDLE_HOLD = 1.3;      // s each is held
export const IDLE_ORDER = ['paris', 'istanbul', 'tokyo', 'sydney', 'newyork', 'cairo', 'rio', 'london'];

export const SERIF = "'Didot', 'Bodoni 72', 'Times New Roman', Georgia, serif";
