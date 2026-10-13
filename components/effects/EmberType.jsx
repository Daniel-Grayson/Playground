'use client';

import { useCanvas } from '@/lib/useCanvas';
import { renderText } from '@/lib/text';
import { cssVar } from '@/lib/css';

/**
 * Ember type — the word burns and keeps reforming.
 *
 * This is Doom's 1993 fire routine. Heat lives on a coarse grid; each cell
 * copies the one below it, loses a random amount, and drifts a column left or
 * right. Run that upward every frame and you get convection for almost no
 * arithmetic — no particles, no physics.
 *
 * The twist is the seed: instead of a hot strip along the bottom, the word's
 * own pixels are held at maximum heat, so the letters are the fuel. They read
 * clearly at the source and dissolve as the heat rises off them.
 */
export default function EmberType({
  text = 'EMBER',
  cols = 150,
  heat = 36,
  drift = 1,
}) {
  const ref = useCanvas({
    deps: [text, cols, heat],

    init: ({ canvas, w, h }) => build(canvas, w, h, text, cols, heat),
    resize: ({ canvas, w, h, state }) => {
      Object.assign(state, build(canvas, w, h, text, cols, heat));
    },

    frame: ({ ctx, w, h, dpr, state }) => {
      const { gw, gh, seed, buf, lut, img, scratch } = state;
      const max = lut.length - 1;

      // The word is the fuel, so it alone sits at full heat. The floor is
      // seeded cooler — at full heat its flood climbs over the letters and
      // the word stops reading.
      for (let i = 0; i < seed.length; i++) if (seed[i]) buf[i] = max;
      const floorHeat = Math.round(max * 0.5);
      for (let x = 0; x < gw; x++) buf[(gh - 1) * gw + x] = floorHeat;

      // Propagate upward: each cell pulls from below, cooling and wandering.
      for (let y = 1; y < gh; y++) {
        const row = y * gw;
        const up = (y - 1) * gw;
        for (let x = 0; x < gw; x++) {
          const decay = (Math.random() * 3) | 0;
          const nx = x + (((Math.random() * 3) | 0) - 1) * drift;
          if (nx < 0 || nx >= gw) continue;
          const v = buf[row + x] - decay;
          buf[up + nx] = v > 0 ? v : 0;
        }
      }

      const px = img.data;
      for (let i = 0; i < buf.length; i++) {
        const c = lut[buf[i]];
        const o = i * 4;
        px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
      }
      scratch.ctx.putImageData(img, 0, 0);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(scratch.canvas, 0, 0, w, h);
    },
  });

  return <canvas ref={ref} aria-label={`The word ${text} burning like embers`} role="img" />;
}

function build(canvas, w, h, text, cols, heat) {
  const gw = Math.max(40, Math.round(cols));
  const gh = Math.max(24, Math.round(gw * (h / Math.max(w, 1))));

  // Sample the word at grid resolution: those cells become the fuel.
  const t = renderText(text, {
    width: gw, height: gh, color: '#fff', weight: 800, padding: 0.08,
  });
  const d = t.getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, gw, gh).data;
  const seed = new Uint8Array(gw * gh);
  for (let i = 0; i < seed.length; i++) seed[i] = d[i * 4 + 3] > 120 ? 1 : 0;

  const scratchCanvas = document.createElement('canvas');
  scratchCanvas.width = gw;
  scratchCanvas.height = gh;

  return {
    gw, gh, seed,
    buf: new Uint8Array(gw * gh),
    lut: heatLut(canvas, Math.max(8, Math.round(heat))),
    img: new ImageData(gw, gh),
    scratch: { canvas: scratchCanvas, ctx: scratchCanvas.getContext('2d') },
  };
}

/** Cool-to-hot colour ramp built from the card's own palette. */
function heatLut(canvas, steps) {
  const bg = cssVar(canvas, '--bg', '#111111');
  const mid = cssVar(canvas, '--accent', cssVar(canvas, '--text-2', '#b9740f'));
  const hot = cssVar(canvas, '--text', '#f5a623');
  const stops = [[0, bg], [0.42, mid], [0.8, hot], [1, mix(hot, '#ffffff', 0.72)]];

  const lut = [];
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let k = 0; k < stops.length - 1; k++) {
      if (p >= stops[k][0] && p <= stops[k + 1][0]) { a = stops[k]; b = stops[k + 1]; }
    }
    const t = (p - a[0]) / Math.max(1e-6, b[0] - a[0]);
    lut.push(blend(a[1], b[1], t));
  }
  return lut;
}

function rgb(hex) {
  let s = String(hex).replace('#', '').trim();
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s, 16);
  return Number.isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function blend(a, b, t) {
  const A = rgb(a); const B = rgb(b);
  return [
    Math.round(A[0] + (B[0] - A[0]) * t),
    Math.round(A[1] + (B[1] - A[1]) * t),
    Math.round(A[2] + (B[2] - A[2]) * t),
  ];
}
function mix(a, b, t) {
  const c = blend(a, b, t);
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
