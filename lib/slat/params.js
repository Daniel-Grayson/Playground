// Slat — three posters on one rotating prism.
//
// THERE IS NO OPACITY IN THIS PIECE AT ANY POINT. The card is a row of
// triangular prisms standing on end. Each prism carries three faces at 120
// degrees, each face printed with a different poster, and the whole row turns
// together. A scene arrives because its face has rotated toward you and the
// previous one has rotated away — the changeover is projected width, nothing
// else. No crossfade, no mask, no second pass.
//
// THE PROJECTION IS THE WHOLE MECHANISM. Face k has normal angle
// phi = theta + k*120. It is visible when cos(phi) > 0, it sits at horizontal
// position sin(phi) so the visible faces sort left to right by that, and it
// takes a share of the slat proportional to cos(phi). Three faces 120 apart
// means exactly one or exactly two are ever visible: at theta = 0, 120, 240 a
// single face owns the full slat and you get a clean, undistorted poster, and
// everywhere between, two posters are interleaved in alternating bands.
//
// So the "readable" states and the "shredded" states are the same formula at
// different angles. The piece holds at each of the three clean angles and
// whips between them, which is the only authored timing in it.
//
// WIDTHS ARE NORMALISED AGAINST THEIR OWN SUM, not drawn at raw cos. A real
// triangular prism has a silhouette that breathes as it turns, and letting the
// row do that leaves gaps of card background opening and closing between the
// slats. Dividing by the sum keeps every slat exactly full. It is a cheat of
// about seven percent at worst and it is invisible, because nothing in the
// frame is a straight reference edge.
//
// EACH FACE SHOWS ITS OWN SLAT'S COLUMN, COMPRESSED. Face k of slat i samples
// the band of poster k that lives at slat i's x range and squeezes it into the
// face's width. That is what a lenticular sheet physically does, and it is why
// the type stays in place as it narrows instead of sliding sideways.

import { sampleMonotone as sample } from '../math';

export const SLAT_PX = 54;      // target slat width in CSS px
export const MIN_SLATS = 10;

// Shading is DARKEN ONLY, and measured against the face angle that points
// straight at the viewer rather than against the light itself. Two reasons.
// Washing a saturated ink with white kills the colour and reads as a faded
// print, not a lit surface. And normalising at phi = 0 means a face square to
// the camera is never touched at all, so each of the three clean states is a
// pristine poster while the interleaved states still get a hard light/dark
// split between neighbouring faces.
export const LIGHT_DEG = -30;
export const LIGHT_GAIN = 0.5;

export const CYCLE_SEC = 8.4;
export const WIND_DEG = 46;     // how far the pointer can nudge the turn
export const WIND_MS = 220;

/** Face k carries this scene, so the clean states read 0, 1, 2 in order. */
export function sceneOf(k) {
  return (3 - k) % 3;
}

export const SCENES = [
  { word: 'OPEN', bg: '#f2ede1', ink: '#14263f' },
  { word: 'SHUT', bg: '#1668ff', ink: '#eaff5a' },
  { word: 'TURN', bg: '#ff3d6e', ink: '#fff1d6' },
];

/**
 * One third of a turn, normalised. Holds at the clean angle for the first
 * quarter of its third, then whips through the interleave. Read with the
 * monotone sampler: an overshoot here would run the prism past its face and
 * back, which on a hard-edged shape reads as a judder rather than a bounce.
 */
export const TURN_TABLE = [
  0, 0, 0, 0, 0.012, 0.045, 0.115, 0.24, 0.42, 0.62, 0.78, 0.885, 0.95, 0.985, 1,
];

/** Turn angle in degrees at time t, continuous and strictly increasing. */
export function turnAt(t) {
  const u = ((t % CYCLE_SEC) + CYCLE_SEC) % CYCLE_SEC / CYCLE_SEC;
  const third = Math.floor(u * 3);
  return third * 120 + sample(TURN_TABLE, u * 3 - third) * 120;
}
