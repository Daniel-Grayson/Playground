'use client';

import { useCanvas } from '@/lib/useCanvas';
import { cssVar } from '@/lib/css';
import { clamp, damp } from '@/lib/math';

/**
 * Orbit field — points circling a tilted sphere.
 *
 * Scattering points by picking random latitude and longitude clumps them at
 * the poles, because lines of longitude converge there. The Fibonacci lattice
 * avoids that: step evenly through z and advance the angle by the golden
 * angle each time, and the points land almost perfectly evenly.
 *
 * After rotating, z does double duty — it sets both the dot radius and its
 * alpha, so depth falls out of a single number with no z-buffer involved.
 */
export default function OrbitField({
  count = 720,
  speed = 0.3,
  tilt = 0.42,
  dotSize = 1.9,
}) {
  const ref = useCanvas({
    deps: [count],

    init: ({ canvas, w, h }) => build(canvas, w, h, count),
    resize: ({ canvas, w, h, state }) => {
      Object.assign(state, build(canvas, w, h, count), {
        yaw: state.yaw, pitch: state.pitch,
      });
    },

    frame: ({ ctx, w, h, dpr, dt, state, pointer }) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      state.yaw += dt * speed;
      // Pointer tilts the sphere; it eases back to the default when you leave.
      const targetPitch = pointer.inside ? tilt + pointer.ny * 0.5 : tilt;
      state.pitch = damp(state.pitch, targetPitch, 0.18, dt);

      const cy = Math.cos(state.yaw), sy = Math.sin(state.yaw);
      const cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);

      const cx = w / 2;
      const cyc = h / 2;
      const R = Math.min(w, h) * 0.38;

      ctx.fillStyle = state.ink;
      for (const p of state.pts) {
        // Rotate about Y, then about X.
        const x1 = p.x * cy + p.z * sy;
        const z1 = -p.x * sy + p.z * cy;
        const y2 = p.y * cp - z1 * sp;
        const z2 = p.y * sp + z1 * cp;

        // Weak perspective: nearer points spread out slightly.
        const persp = 1 / (1.9 - z2 * 0.55);
        const sx = cx + x1 * R * persp * 1.9;
        const sy2 = cyc + y2 * R * persp * 1.9;

        const depth = clamp((z2 + 1) / 2);          // 0 behind, 1 in front
        const r = dotSize * (0.35 + depth * 1.15);
        ctx.globalAlpha = 0.1 + depth * depth * 0.85;
        ctx.beginPath();
        ctx.arc(sx, sy2, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  });

  return <canvas ref={ref} aria-label="Points orbiting a tilted sphere" role="img" />;
}

function build(canvas, w, h, count) {
  const n = Math.max(20, Math.round(count));
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5)); // ~2.39996 rad

  for (let i = 0; i < n; i++) {
    // Even steps through z give equal-area bands; the golden angle keeps
    // successive points from lining up into spirals the eye can latch onto.
    const z = 1 - (2 * i) / (n - 1);
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    const theta = golden * i;
    pts.push({ x: Math.cos(theta) * r, y: z, z: Math.sin(theta) * r });
  }

  return { pts, yaw: 0, pitch: 0.42, ink: cssVar(canvas, '--text', '#111') };
}
