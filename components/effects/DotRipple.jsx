'use client';

import { useCanvas } from '@/lib/useCanvas';
import { cssVar } from '@/lib/css';
import { clamp, TAU } from '@/lib/math';

/**
 * Dot ripple — a grid that carries your clicks outward as rings.
 *
 * Each click pushes a ring onto a short list. Every dot measures its distance
 * to each live ring and takes a displacement from a *windowed* sine — the
 * window is what gives the wave a front and a back, instead of ringing
 * forever like a bare sine would.
 *
 * Rings expire off the list, so the per-frame cost is dots × live rings and
 * stays flat however long the page has been open.
 */
export default function DotRipple({
  spacing = 26,
  speed = 420,
  amplitude = 16,
  width = 90,
  dotSize = 2,
}) {
  const ref = useCanvas({
    deps: [spacing, dotSize],

    init: ({ canvas, w, h }) => build(canvas, w, h, spacing),
    resize: ({ canvas, w, h, state }) => {
      Object.assign(state, build(canvas, w, h, spacing), { rings: state.rings });
    },

    frame: ({ ctx, w, h, dpr, dt, state, pointer }) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // consumePress() catches clicks shorter than a frame; rawX/rawY is the
      // real cursor position rather than the smoothed one that lags it.
      if (pointer.consumePress()) {
        state.rings.push({ x: pointer.rawX, y: pointer.rawY, r: 0, life: 1 });
        if (state.rings.length > 6) state.rings.shift();
      }

      // Idle: emit a ring from the centre now and then so it is never dead.
      state.idle -= dt;
      if (state.idle <= 0) {
        state.idle = 3.4;
        state.rings.push({ x: w / 2, y: h / 2, r: 0, life: 1 });
        if (state.rings.length > 6) state.rings.shift();
      }

      const maxR = Math.hypot(w, h);
      for (const ring of state.rings) {
        ring.r += speed * dt;
        ring.life = clamp(1 - ring.r / maxR);
      }
      state.rings = state.rings.filter((r) => r.life > 0.001);

      const { dots } = state;
      ctx.fillStyle = state.ink;

      for (const d of dots) {
        let push = 0;
        for (const ring of state.rings) {
          const dist = Math.hypot(d.x - ring.x, d.y - ring.y) - ring.r;
          if (Math.abs(dist) > width) continue;
          // Hann window over the wavefront: smooth in, smooth out.
          const win = 0.5 + 0.5 * Math.cos((dist / width) * Math.PI);
          // sin x window peaks at 0.5, so double it: one ring then swings a
          // dot through the full -1..1 range and `amplitude` means pixels.
          push += Math.sin((dist / width) * TAU * 0.5) * win * ring.life * 2;
        }

        const s = dotSize * (1 + push * 0.9);
        if (s <= 0.12) continue;
        const lift = push * amplitude;

        ctx.globalAlpha = clamp(0.24 + Math.abs(push) * 0.76, 0, 1);
        ctx.beginPath();
        ctx.arc(d.x, d.y - lift, s, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  });

  return <canvas ref={ref} aria-label="A grid of dots rippling outward from each click" role="img" />;
}

function build(canvas, w, h, spacing) {
  const gap = Math.max(8, spacing);
  const cols = Math.ceil(w / gap);
  const rows = Math.ceil(h / gap);
  const ox = (w - (cols - 1) * gap) / 2;
  const oy = (h - (rows - 1) * gap) / 2;

  const dots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push({ x: ox + c * gap, y: oy + r * gap });
    }
  }
  return {
    dots,
    rings: [],
    idle: 1,
    ink: cssVar(canvas, '--text', '#111'),
  };
}
