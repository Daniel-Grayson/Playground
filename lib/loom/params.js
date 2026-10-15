// Loom — damask. Two threads, one cloth, and a word you can only see because
// the weave turns over inside it.
//
// NOTHING IS EVER RECOLOURED TO MAKE THE MOTIF. The whole card is a five-end
// satin in exactly two threads: a warp and a weft. Cell (i, j) has the warp on
// top when (i*2 + j) % 5 < f, where f is the warp float length. Outside the
// word f is 4, so the warp floats over four of every five crossings and the
// cloth reads as warp colour with the weft showing as sparse dots. Inside the
// word the identical satin runs at f = 1, so the same two threads read as weft
// colour instead. The letterform is a change of float length and nothing else
// — no second ink, no overlay, no mask of colour.
//
// An earlier version made the motif by flipping the over/under parity of a
// plain one-up-one-down weave. It is the same idea and it is completely
// invisible: a one-cell phase shift in a checkerboard carries almost no tonal
// weight, and the word simply cannot be seen. Float LENGTH is what changes the
// tone of a woven surface, which is why damask is woven this way and not that.
//
// THE BLANK FRAME IS A REAL STATE OF THE CLOTH, NOT A TRICK. f steps 4 → 3 and
// 1 → 2 either side, and when both reach 3 the inside and the outside are the
// same weave, so the motif is not hidden, it is absent. That is where the next
// word is swapped in and where the palette crossfades, and it needs no
// transition code because the mechanism already passes through a frame with
// nothing to cut.
//
// THE PALETTE CROSSFADES, THE WEAVE STEPS. Opposite cadences on purpose. A
// loom changes shed discretely and should look it; a dye change should not.
// The crossfade is quantised to eighths so the handful of tiles it needs can
// be cached instead of rebuilt per frame, and it is sized to finish inside the
// blank — bleeding past it would recolour a cloth that already has a motif in
// it, which is the one thing the blank exists to avoid.

// Thread pitch as a fraction of card height, clamped. An absolute pitch gives
// the small card in the feed column only about 26 threads top to bottom, which
// is too few rows for a letterform to survive the satin.
export const CELL_FRAC = 0.0145;
export const CELL_MIN = 3;
export const CELL_MAX = 14;
export const SATIN = 5;       // ends in the repeat
export const STEP = 2;        // satin step — 2 gives the classic broken diagonal

/** Warp is on top at this crossing when the satin counter falls under f. */
export function warpOver(i, j, f) {
  return (((i * STEP + j) % SATIN) + SATIN) % SATIN < f;
}

// [warp float, weft-side float]. The cycle opens on the blank so the swap and
// the crossfade both land at t = 0 of a cycle.
export const PHASES = [
  { out: 3, in: 3, secs: 0.34 },   // blank — motif absent, palette crossfades
  { out: 3, in: 2, secs: 0.20 },
  { out: 4, in: 2, secs: 0.20 },
  { out: 4, in: 1, secs: 2.30 },   // full contrast, the cloth to read
  { out: 4, in: 2, secs: 0.20 },
  { out: 3, in: 2, secs: 0.20 },
];

export const CYCLE_SEC = PHASES.reduce((a, p) => a + p.secs, 0);
export const BLEND_SEC = 0.30;    // must stay inside PHASES[0].secs
export const BLEND_STEPS = 8;

export const SHEEN_SEC = 9.0;     // raking light crossing the cloth
export const WIND_MS = 200;

export const SCENES = [
  { word: 'loom', warp: '#c8402f', weft: '#f2dfa8' },
  { word: 'weft', warp: '#1c3f5f', weft: '#9fd8c8' },
  { word: 'warp', warp: '#2e2436', weft: '#e0a23c' },
];

/** Where we are in the cycle: phase, time into it, and the scene index. */
export function phaseAt(t) {
  const cycles = Math.floor(t / CYCLE_SEC);
  let u = t - cycles * CYCLE_SEC;
  for (let i = 0; i < PHASES.length; i++) {
    if (u < PHASES[i].secs || i === PHASES.length - 1) {
      return { i, u, phase: PHASES[i], scene: ((cycles % SCENES.length) + SCENES.length) % SCENES.length };
    }
    u -= PHASES[i].secs;
  }
  return { i: 0, u: 0, phase: PHASES[0], scene: 0 };
}
