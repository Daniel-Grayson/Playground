'use client';

import { useCanvas } from '@/lib/useCanvas';
import { cssVar } from '@/lib/css';
import { fbm, rng, TAU } from '@/lib/math';

/**
 * Flow field — particles combing through an invisible current.
 *
 * Noise is read as an angle at every point; each particle just walks in the
 * direction it finds under itself. Nothing knows about anything else, yet the
 * paths organise into streams, because neighbouring particles read nearly the
 * same angle.
 *
 * The trails are the other half: the canvas is never cleared, only washed with
 * a nearly-transparent rectangle each frame, so old paths decay exponentially
 * instead of disappearing. That one call is the entire memory of the system.
 */
export default function FlowField({
  count = 1400,
  scale = 1.5,
  speed = 1,
  fade = 0.055,
  pointerForce = 1,
}) {
  const ref = useCanvas({
    deps: [count, scale],

    init: ({ canvas, w, h }) => init(canvas, w, h, count),
    resize: ({ canvas, w, h, state }) => {
      Object.assign(state, init(canvas, w, h, count));
    },

    frame: ({ ctx, w, h, dpr, t, dt, state, pointer }) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // The wash. Not a clear — this is what leaves trails.
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = state.wash.replace('ALPHA', fade.toFixed(3));
      ctx.fillRect(0, 0, w, h);

      const f = 0.0022 * scale;
      const drift = t * 0.08;
      const px = pointer.inside ? pointer.x : -1e4;
      const py = pointer.inside ? pointer.y : -1e4;
      const reach = Math.min(w, h) * 0.35;

      ctx.lineWidth = 1;
      ctx.strokeStyle = state.ink;
      ctx.beginPath();

      for (const p of state.parts) {
        const a = fbm(p.x * f, p.y * f + drift, 3) * TAU * 1.4;
        let vx = Math.cos(a);
        let vy = Math.sin(a);

        // The pointer shoulders particles aside without overpowering the field.
        const dx = p.x - px;
        const dy = p.y - py;
        const d = Math.hypot(dx, dy);
        if (d < reach) {
          const k = (1 - d / reach) ** 2 * pointerForce * 2.2;
          vx += (dx / (d || 1)) * k;
          vy += (dy / (d || 1)) * k;
        }

        const step = 42 * speed * dt * 60 * (1 / 60);
        const nx = p.x + vx * step * p.s;
        const ny = p.y + vy * step * p.s;

        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);

        p.x = nx;
        p.y = ny;
        p.life -= dt;

        // Respawn on death or on leaving the frame, so density stays even.
        if (p.life <= 0 || nx < -10 || nx > w + 10 || ny < -10 || ny > h + 10) {
          p.x = state.r() * w;
          p.y = state.r() * h;
          p.life = 1.5 + state.r() * 4;
        }
      }
      ctx.stroke();
    },
  });

  return <canvas ref={ref} aria-label="Particles streaming through a noise flow field" role="img" />;
}

function init(canvas, w, h, count) {
  const r = rng(7);
  const parts = [];
  const n = Math.max(50, Math.round(count));
  for (let i = 0; i < n; i++) {
    parts.push({
      x: r() * w,
      y: r() * h,
      s: 0.6 + r() * 0.8,     // per-particle speed, so streams have texture
      life: r() * 5,
    });
  }

  // Wash colour is the page background with a placeholder alpha, swapped per
  // frame. Reading it from the theme means trails fade to the real backdrop.
  const bg = cssVar(canvas, '--bg', '#ffffff');
  const rgb = hexToRgbString(bg);

  return {
    parts,
    r,
    wash: `rgba(${rgb}, ALPHA)`,
    ink: withAlpha(cssVar(canvas, '--text', '#111'), 0.5),
  };
}

function hexToRgbString(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return '255,255,255';
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function withAlpha(hex, a) {
  return `rgba(${hexToRgbString(hex)}, ${a})`;
}
