'use client';

import { useCanvas } from '@/lib/useCanvas';
import { cssVar } from '@/lib/css';
import { damp } from '@/lib/math';

/**
 * Cursor lens — a glass disc that bends whatever is under it.
 *
 * The content is drawn once to an offscreen canvas. Inside a circular clip it
 * is redrawn as concentric rings, each sampled from a radius pulled inward by
 * a barrel curve — so the middle magnifies and the rim compresses, the way a
 * real lens does. The inverted ink is a second pass with a difference blend,
 * and that inversion is what makes it read as glass rather than as a zoom.
 */
export default function CursorLens({
  text = 'LOOK CLOSER',
  size = 150,
  zoom = 1.9,
  invert = true,
  rings = 34,
}) {
  const ref = useCanvas({
    deps: [text, size, zoom, invert, rings],

    init: ({ canvas, w, h }) => buildLens(canvas, w, h, text),
    resize: ({ canvas, w, h, state }) => {
      Object.assign(state, buildLens(canvas, w, h, text));
    },

    frame: ({ ctx, w, h, dpr, dt, state, pointer }) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const { src } = state;
      ctx.drawImage(src, 0, 0, w, h);

      state.x = damp(state.x, pointer.inside ? pointer.x : w / 2, 0.055, dt);
      state.y = damp(state.y, pointer.inside ? pointer.y : h / 2, 0.055, dt);
      state.r = damp(state.r, pointer.inside ? size / 2 : size / 2.6, 0.09, dt);

      const { x: cx, y: cy, r } = state;
      if (r < 2) return;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // Rings from the rim inward. Each is a scaled copy of the source about
      // the lens centre; the scale curve is what makes it bulge.
      const n = Math.max(6, Math.round(rings));
      for (let i = n; i >= 0; i--) {
        const t = i / n;                       // 1 at rim, 0 at centre
        const ringR = r * t;
        // Barrel: magnification falls off toward the rim.
        const mag = 1 + (zoom - 1) * (1 - t * t);

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.clip();
        ctx.translate(cx, cy);
        ctx.scale(mag, mag);
        ctx.translate(-cx, -cy);
        ctx.drawImage(src, 0, 0, w, h);
        ctx.restore();
      }

      if (invert) {
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();

      // Rim: a thin ring plus a soft inner shadow reads as thickness.
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = state.rim;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      const g = ctx.createRadialGradient(cx, cy, r * 0.72, cx, cy, r);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  });

  return <canvas ref={ref} aria-label={`The words ${text} seen through a lens that follows the pointer`} role="img" />;
}

/** The content under the lens: a headline plus a rule grid to show distortion. */
function buildLens(canvas, w, h, text) {
  const src = document.createElement('canvas');
  src.width = Math.max(2, w);
  src.height = Math.max(2, h);
  const c = src.getContext('2d');

  const bg = cssVar(canvas, '--surface-2', '#f2f2f0');
  const ink = cssVar(canvas, '--text', '#111');
  const faint = cssVar(canvas, '--border', '#e3e3e0');

  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  c.strokeStyle = faint;
  c.lineWidth = 1;
  const gap = 22;
  c.beginPath();
  for (let x = gap; x < w; x += gap) { c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, h); }
  for (let y = gap; y < h; y += gap) { c.moveTo(0, y + 0.5); c.lineTo(w, y + 0.5); }
  c.stroke();

  // Measure rather than guess: a character-count estimate overflows the
  // moment the string has wide letters in it.
  const font = (px) =>
    `800 ${px}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;
  let size = h * 0.3;
  c.font = font(size);
  const maxW = w * 0.88;
  const measured = c.measureText(text).width;
  if (measured > maxW) {
    size *= maxW / measured;
    c.font = font(size);
  }
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, w / 2, h / 2);

  return { src, x: w / 2, y: h / 2, r: 0, rim: cssVar(canvas, '--border-strong', '#ccc') };
}
