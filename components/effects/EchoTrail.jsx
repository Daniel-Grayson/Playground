'use client';

import { useCanvas } from '@/lib/useCanvas';
import { renderText } from '@/lib/text';
import { cssVar } from '@/lib/css';
import { damp } from '@/lib/math';

/**
 * Echo trail — a word that smears into fading copies as you move it.
 *
 * A ring buffer holds the last N positions. The word is stamped once at each,
 * oldest and faintest first. There is no blur filter and no post-processing:
 * the softness is entirely how many translucent copies happen to overlap, so
 * it costs N drawImage calls and nothing else.
 */
export default function EchoTrail({
  text = 'ECHO',
  echoes = 34,
  falloff = 1.5,
  follow = 0.09,
  drift = 1,
}) {
  const ref = useCanvas({
    deps: [text, echoes, falloff, follow, drift],

    init: ({ canvas, w, h }) => build(canvas, w, h, text, echoes),
    resize: ({ canvas, w, h, state }) => {
      Object.assign(state, build(canvas, w, h, text, echoes));
    },

    frame: ({ ctx, w, h, dpr, t, dt, state, pointer }) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const { src, trail } = state;

      // Target: the pointer when it is over the canvas, otherwise a slow
      // lissajous drift so the effect still shows itself on touch devices.
      const tx = pointer.inside
        ? pointer.x
        : w / 2 + Math.sin(t * 0.55 * drift) * w * 0.22;
      const ty = pointer.inside
        ? pointer.y
        : h / 2 + Math.sin(t * 0.83 * drift + 1.2) * h * 0.16;

      state.x = damp(state.x, tx, follow, dt);
      state.y = damp(state.y, ty, follow, dt);

      trail[state.head] = { x: state.x, y: state.y };
      state.head = (state.head + 1) % trail.length;

      const n = trail.length;
      for (let i = 0; i < n; i++) {
        // Walk oldest -> newest so the brightest copy lands on top.
        const p = trail[(state.head + i) % n];
        if (!p) continue;
        const age = i / (n - 1); // 0 = oldest, 1 = newest
        const alpha = Math.pow(age, falloff) * 0.85;
        if (alpha < 0.004) continue;
        ctx.globalAlpha = alpha;
        ctx.drawImage(src, p.x - src.width / 2, p.y - src.height / 2);
      }
      ctx.globalAlpha = 1;
    },
  });

  return <canvas ref={ref} aria-label={`The word ${text} trailing fading copies behind the pointer`} role="img" />;
}

function build(canvas, w, h, text, echoes) {
  const src = renderText(text, {
    width: Math.max(Math.round(w * 0.6), 2),
    height: Math.max(Math.round(h * 0.3), 2),
    color: cssVar(canvas, '--text', '#111'),
    weight: 800,
    letterSpacing: 0.01,
    padding: 0.02,
  });
  return {
    src,
    trail: new Array(Math.max(2, Math.round(echoes))).fill(null),
    head: 0,
    x: w / 2,
    y: h / 2,
  };
}
