'use client';

import { useCanvas } from '@/lib/useCanvas';
import { cssVar } from '@/lib/css';
import { clamp, rng, TAU } from '@/lib/math';

/**
 * Confetti burst — press anywhere.
 *
 * Gravity alone makes scraps fall like gravel. Three other terms do the work:
 * air drag, which is stronger horizontally than vertically, so throws lose
 * their sideways speed first; spin; and a width that tracks |cos(angle)|, so
 * each scrap turns edge-on and nearly vanishes twice per rotation. That last
 * one is the flutter — it is a drawing trick, not simulated aerodynamics.
 *
 * Scraps settle on the floor and fade rather than dropping out of frame, and
 * a burst fires on its own every couple of seconds so the card is never dead.
 */
export default function ConfettiBurst({
  count = 90,
  gravity = 620,
  spread = 440,
  interval = 2.1,
}) {
  const ref = useCanvas({
    deps: [count, gravity, spread, interval],

    init: ({ canvas }) => ({
      p: [],
      since: interval - 0.2,   // fire almost immediately on first view
      ink: cssVar(canvas, '--text', '#fff3e4'),
      accent: cssVar(canvas, '--accent', cssVar(canvas, '--text-2', '#ffd0ae')),
      bg: cssVar(canvas, '--bg', '#ff4a1c'),
      rand: rng(11),
    }),

    resize: ({ canvas, state }) => {
      state.ink = cssVar(canvas, '--text', '#fff3e4');
      state.accent = cssVar(canvas, '--accent', cssVar(canvas, '--text-2', '#ffd0ae'));
      state.bg = cssVar(canvas, '--bg', '#ff4a1c');
    },

    frame: ({ ctx, w, h, dpr, dt, state, pointer }) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = state.bg;
      ctx.fillRect(0, 0, w, h);

      const r = state.rand;
      const burst = (x, y) => {
        for (let i = 0; i < count; i++) {
          const a = r() * TAU;
          const sp = 80 + r() * spread;
          state.p.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 120,   // bias upward so it arcs
            w: 5 + r() * 7,
            h: 3 + r() * 4,
            a: r() * TAU,
            va: (r() - 0.5) * 18,
            t: r(),                        // position along the colour ramp
            life: 2.4 + r() * 1.0,
          });
        }
      };

      // consumePress() catches a click shorter than one frame.
      if (pointer.consumePress()) burst(pointer.rawX, pointer.rawY);

      state.since += dt;
      if (state.since > interval) {
        state.since = 0;
        burst(w / 2, h * 0.46);
      }

      const floor = h - 6;
      for (const p of state.p) {
        p.vy += gravity * dt;
        // Drag: stronger across than down, so throws flatten out.
        p.vx *= 1 - 1.1 * dt;
        p.vy *= 1 - 0.5 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.a += p.va * dt;
        p.life -= dt;

        if (p.y > floor) {
          p.y = floor;
          p.vy *= -0.24;
          p.vx *= 0.7;
          p.va *= 0.5;
          if (Math.abs(p.vy) < 24) p.vy = 0;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.fillStyle = blendHex(state.ink, state.accent, p.t);
        // Edge-on twice per turn: this is what reads as flutter.
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (0.25 + Math.abs(Math.cos(p.a))));
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      state.p = state.p.filter((p) => p.life > 0);
    },
  });

  return <canvas ref={ref} aria-label="Confetti bursting and settling; press to throw more" role="img" />;
}

function blendHex(a, b, t) {
  const A = hex(a); const B = hex(b);
  const c = [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function hex(h) {
  let s = String(h).replace('#', '').trim();
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s, 16);
  return Number.isNaN(n) ? [255, 255, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
