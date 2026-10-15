// Press — four ink plates and a registration that comes and goes.
//
// THE ENTIRE ANIMATION IS FOUR OFFSETS AND FOUR SMALL ANGLES. Each scene is a
// flat composition split across four plates, one ink each, printed onto paper
// by multiply. Nothing in the artwork ever moves relative to its own plate;
// what reads as the image tearing into chromatic fringes is the plates walking
// out of register, and what reads as it resolving is them walking back.
// Overlaps make their own third and fourth colours for free, because multiply
// is what ink actually does.
//
// REGISTRATION CROSSES ARE THE HONEST PART. Every plate prints its own crosses
// in the four corners. They only stack into one mark when the press is true,
// so the frame tells you its own state without any chrome.
//
// THE SWAP HAPPENS AT PEAK DRIFT. New plate artwork is cut in at the instant
// the image is already shattered, so there is no frame in which you can see
// one composition become another — you see a mess resolve into something that
// was not there before. That is the whole transition, and it costs nothing:
// the drift the piece already needed is the cover.
//
// ANGLE MATTERS AS MUCH AS OFFSET. Pure translation reads as a slipped layer.
// Real misregistration on a sheet-fed press has a rotational component, and
// under a degree of it is what makes the fringes splay along one edge instead
// of sitting parallel — it is the difference between "two copies" and "badly
// printed once".
//
// PLATES ARE PAPER-WHITE OUTSIDE THEIR MARKS, so an offset plate exposes bare
// sheet at the trailing edge and multiplying white over paper leaves paper.
// The drift therefore needs no padding, no clipping and no edge handling.

import { sampleMonotone } from '../math';

export const sample = sampleMonotone;

export const PHASES = [
  { kind: 'hold', secs: 1.95 },   // in register — the poster
  { kind: 'out', secs: 0.52 },    // the press loses it
  { kind: 'peak', secs: 0.20 },   // shattered; artwork swaps on entry
  { kind: 'in', secs: 0.78 },     // and finds it again
];
export const CYCLE_SEC = PHASES.reduce((a, p) => a + p.secs, 0);

/** Hangs, then goes all at once. */
export const OUT_TABLE = [0, 0.004, 0.015, 0.04, 0.1, 0.26, 0.55, 0.82, 0.95, 1];
/** Comes back slower than it left, and does not overshoot: it is being corrected. */
export const IN_TABLE = [1, 0.99, 0.95, 0.86, 0.72, 0.55, 0.38, 0.23, 0.12, 0.05, 0.015, 0];

export const REF_W = 1344;      // amplitudes are authored against this width

/** Per plate: how far it walks, which way, how much it twists, and its shimmy. */
export const PLATES = [
  { amp: 58, deg: 152, rot: -0.9, wob: 7, freq: 5.1 },
  { amp: 66, deg: -20, rot: 1.2, wob: 9, freq: 6.4 },
  { amp: 44, deg: 74, rot: -1.6, wob: 6, freq: 4.3 },
  { amp: 50, deg: -118, rot: 0.6, wob: 8, freq: 7.2 },
];

export const WIND_PX = 26;      // how far the pointer can push the press
export const WIND_MS = 190;

// Shapes are normalised: x and w against the card width, y and h against its
// height, radii and line widths against the height. One composition therefore
// holds its proportions at any card size.
export const SCENES = [
  {
    paper: '#f4efe3',
    inks: ['#1150ff', '#ff2d87', '#ffc400', '#14121a'],
    art: [
      [['circle', 0.32, 0.47, 0.48], ['rect', 0.10, 0.79, 0.63, 0.085]],
      [['circle', 0.45, 0.42, 0.48], ['rect', 0.655, 0.16, 0.046, 0.63]],
      [['ring', 0.617, 0.50, 0.40, 0.12], ['rect', 0.125, 0.16, 0.10, 0.215],
       ['tri', 0.79, 0.78, 0.885, 0.38, 0.935, 0.78]],
      [['rules', 0.10, 0.145, 0.42, 7, 0.0355, 0.009], ['circle', 0.233, 0.555, 0.119],
       ['frame', 0.767, 0.153, 0.175, 0.29, 0.013]],
    ],
  },
  {
    paper: '#f1ece1',
    inks: ['#0a9396', '#ee6c4d', '#ffd166', '#1d1a2f'],
    art: [
      [['rect', 0.06, 0.18, 0.30, 0.64], ['circle', 0.78, 0.30, 0.20]],
      [['circle', 0.30, 0.50, 0.34], ['rect', 0.56, 0.62, 0.38, 0.14]],
      [['tri', 0.42, 0.82, 0.60, 0.18, 0.78, 0.82], ['rect', 0.06, 0.06, 0.88, 0.055]],
      [['ring', 0.30, 0.50, 0.40, 0.02], ['rules', 0.56, 0.20, 0.38, 5, 0.05, 0.012],
       ['circle', 0.88, 0.80, 0.07]],
    ],
  },
  {
    paper: '#efe9dc',
    inks: ['#5a3fc0', '#00b4a6', '#ff9f1c', '#171419'],
    art: [
      [['rules', 0.08, 0.14, 0.84, 9, 0.085, 0.028]],
      [['circle', 0.50, 0.50, 0.33], ['rect', 0.08, 0.80, 0.84, 0.09]],
      [['rect', 0.30, 0.12, 0.40, 0.76]],
      [['ring', 0.50, 0.50, 0.455, 0.016], ['frame', 0.07, 0.10, 0.86, 0.80, 0.012],
       ['circle', 0.50, 0.50, 0.06]],
    ],
  },
];

/** Drift 0..1 at time t, plus which scene is on the press. */
export function pressAt(t) {
  const cycles = Math.floor(t / CYCLE_SEC);
  let u = t - cycles * CYCLE_SEC;
  const scene = ((cycles % SCENES.length) + SCENES.length) % SCENES.length;
  // Artwork is cut in at the top of the peak, so a cycle shows the OLD scene
  // up to that point and the new one from there on.
  if (u < PHASES[0].secs) return { drift: 0, scene, swapped: false };
  u -= PHASES[0].secs;
  if (u < PHASES[1].secs) return { drift: sample(OUT_TABLE, u / PHASES[1].secs), scene, swapped: false };
  u -= PHASES[1].secs;
  if (u < PHASES[2].secs) return { drift: 1, scene, swapped: true };
  u -= PHASES[2].secs;
  return { drift: sample(IN_TABLE, Math.min(1, u / PHASES[3].secs)), scene, swapped: true };
}

/** The scene actually on the press: the swap lands inside the peak. */
export function sceneAt(t) {
  const { scene, swapped } = pressAt(t);
  return swapped ? (scene + 1) % SCENES.length : scene;
}
