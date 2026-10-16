// Post — a sheet of city stamps, and the one you are over comes up off it.
//
// The look is a collector's album page: monochrome photo stamps loose on a
// cream sheet, overlapping, each a little off square. Every stamp is two
// colours and only two — one ink and the paper it is printed on — which is
// how intaglio postage was actually made, and it is also why the sheet can
// carry eight hues without turning into a mess: no stamp ever mixes them.
//
// The pictures are real photographs of each city, all CC0 or public domain
// (credits in `public/post/CREDITS.md`), colour graded into the stamp's ink.
// The grade throws away every hue the photograph had and keeps all of its
// light: luminance alone picks a colour along one ramp, from the ink's deep
// shade through the ink to the paper. That is what a monochrome print is,
// and it is why a blue-sky photograph of Paris and a sand-coloured one of
// Giza come out as belonging to the same sheet. The grade runs once per
// stamp per resize, not per frame.
//
// The interaction is the one thing you do with a loose stamp: pick it up and
// put it somewhere else. Press on a stamp and it comes up off the sheet — it
// grows a little, squares up, and its shadow lengthens and softens — and it
// goes wherever the pointer takes it, anywhere in the frame. Let go and it
// settles where it was put, back to its own tilt, and stays on top of the
// pile. Nothing on the sheet moves unless it is being moved: there is no
// idle motion and no hover motion.
//
// Each stamp's lift is a single damped number, 0 to 1, and everything about
// the lift — scale, squaring, lean, shadow — is read from it. There is no
// lift animation and no settle animation; there is a target and a follower.
//
// Every length is a fraction of card height.

export const PAPER = '#e9e4d8';          // the album sheet

// The sheet's surface: a height field lit from the top left. Octaves are
// [cell size in CSS px, height]; `relief` turns slope into light, `mottle`
// lets height tint the tone, and fibres are per million device pixels.
export const SHEET = {
  octaves: [[180, 1.0], [48, 0.7], [14, 0.6], [4, 0.5]],
  tooth: 0.9,
  fibres: 260,
  fibreDepth: 0.6,
  relief: 9,
  mottle: 4,
};

// The stamps: city, the country line, the face value, ink, and which way up.
// Placement is in fractions of the card (x of width, y of height), and some
// run off the edge on purpose, as they do on a real sheet.
export const STAMPS = [
  { key: 'newyork', photo: '/post/newyork.jpg', focus: [0.35, 0.45], city: 'NEW YORK', country: 'U.S.A.', value: '8¢', ink: '#e0332b', shape: 'land', x: 0.29, y: 0.21, rot: -2.2 },
  { key: 'paris', photo: '/post/paris.jpg', focus: [0.5, 0.45], city: 'PARIS', country: 'FRANCE', value: '30 F', ink: '#2f3fd0', shape: 'port', x: 0.61, y: 0.24, rot: 3 },
  { key: 'rio', photo: '/post/rio.jpg', focus: [0.4, 0.45], city: 'RIO', country: 'BRASIL', value: '50 Cr', ink: '#0d9455', shape: 'port', x: 0.9, y: 0.2, rot: -3.5 },
  { key: 'tokyo', photo: '/post/tokyo.jpg', focus: [0.5, 0.4], city: 'TOKYO', country: 'NIPPON', value: '¥10', ink: '#7b2fbf', shape: 'port', x: 0.085, y: 0.6, rot: 4 },
  { key: 'istanbul', photo: '/post/istanbul.jpg', focus: [0.45, 0.5], city: 'İSTANBUL', country: 'TÜRKİYE', value: '15 Kr', ink: '#0f8a8f', shape: 'land', x: 0.45, y: 0.59, rot: -1.4 },
  { key: 'sydney', photo: '/post/sydney.jpg', focus: [0.47, 0.6], city: 'SYDNEY', country: 'AUSTRALIA', value: '5d', ink: '#e86a12', shape: 'land', x: 0.83, y: 0.55, rot: 2.2 },
  { key: 'london', photo: '/post/london.jpg', focus: [0.6, 0.5], city: 'LONDON', country: 'POSTAGE', value: '3d', ink: '#c2186b', shape: 'port', x: 0.25, y: 0.93, rot: -4 },
  { key: 'cairo', photo: '/post/cairo.jpg', focus: [0.6, 0.55], city: 'CAIRO', country: 'EGYPT', value: '10 M', ink: '#9a6a00', shape: 'land', x: 0.68, y: 0.87, rot: 1.6 },
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

// The grade. Levels come from the picture's own percentiles; `mid` is where
// on the light ramp the pure ink sits, `shade` how dark the deepest shadow
// is as a fraction of the ink.
export const GRADE = {
  low: 0.02,
  high: 0.98,
  contrast: 0.5,
  grain: 0.05,
  mid: 0.5,
  shade: 0.22,
};

// The lift.
export const LIFT_UP = 0.07;       // s, half-life rising
export const LIFT_DOWN = 0.12;     // s, half-life settling
export const LIFT_SCALE = 0.075;   // grows by this much when held
export const LIFT_SQUARE = 0.75;   // fraction of its tilt it loses when held

export const SERIF = "'Didot', 'Bodoni 72', 'Times New Roman', Georgia, serif";
