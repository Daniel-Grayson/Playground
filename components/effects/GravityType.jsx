'use client';

import { useCanvas } from '@/lib/useCanvas';
import { cssVar } from '@/lib/css';
import { clamp } from '@/lib/math';

/**
 * Gravity type — letters fall out of the headline and pile up.
 *
 * Each letter is a box with position, velocity and angular velocity, stepped
 * semi-implicitly (velocity first, then position — stabler than the naive
 * order at the same cost). Collisions resolve by separating the two boxes
 * along whichever overlap axis is shallower, which is the cheap half of what
 * a real 2D physics engine does and is plenty for a pile of letters.
 *
 * Click to drop; click again to reset.
 */
export default function GravityType({
  text = 'GRAVITY',
  gravity = 1700,
  bounce = 0.32,
  friction = 0.86,
}) {
  const ref = useCanvas({
    deps: [text, gravity, bounce, friction],

    init: ({ canvas, ctx, w, h }) => makeState(canvas, ctx, w, h, text),
    resize: ({ canvas, ctx, w, h, state }) => {
      Object.assign(state, makeState(canvas, ctx, w, h, text));
    },

    frame: ({ ctx, w, h, dpr, dt, state, pointer }) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // One drop per press, including clicks shorter than a frame.
      if (pointer.consumePress()) {
        if (state.dropped) reset(state);
        else state.dropped = true;
      }

      const floor = h - 22;
      const letters = state.letters;

      if (state.dropped) {
        for (const l of letters) {
          l.vy += gravity * dt;
          l.x += l.vx * dt;
          l.y += l.vy * dt;
          l.a += l.va * dt;

          if (l.y + l.hh > floor) {
            l.y = floor - l.hh;
            l.vy *= -bounce;
            l.vx *= friction;
            l.va *= friction;
            if (Math.abs(l.vy) < 26) l.vy = 0; // settle instead of jittering
            // Standing letters rotate toward flat so the pile looks stacked.
            l.va += -l.a * 9 * dt;
            l.va *= 0.9;
          }
          // Rotated glyphs stick out past their half-width, so inset the
          // walls a little or the pile clips against the canvas edge.
          const edge = l.hw + 4;
          if (l.x - edge < 0) { l.x = edge; l.vx = Math.abs(l.vx) * bounce; }
          if (l.x + edge > w) { l.x = w - edge; l.vx = -Math.abs(l.vx) * bounce; }
        }

        // A couple of relaxation passes keeps the pile from sinking into itself.
        for (let pass = 0; pass < 3; pass++) {
          for (let i = 0; i < letters.length; i++) {
            for (let j = i + 1; j < letters.length; j++) {
              separate(letters[i], letters[j], bounce);
            }
          }
        }
      }

      ctx.fillStyle = state.ink;
      ctx.font = state.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const l of letters) {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.a);
        ctx.fillText(l.ch, 0, 0);
        ctx.restore();
      }

      ctx.fillStyle = cssVarCache(state, '--text-3');
      ctx.font = '11px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.dropped ? 'CLICK TO RESET' : 'CLICK TO DROP', w / 2, 18);
    },
  });

  return <canvas ref={ref} aria-label={`The word ${text}, whose letters fall and pile up when clicked`} role="img" />;
}

function makeState(canvas, ctx, w, h, text) {
  const face = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
  let size = clamp((w / Math.max(text.length, 1)) * 1.15, 18, h * 0.42);
  let font = `800 ${size}px ${face}`;
  ctx.font = font;

  const chars = [...text];
  let widths = chars.map((c) => ctx.measureText(c).width);
  let total = widths.reduce((a, b) => a + b, 0);

  // Scale to fit: the per-character estimate overshoots on wide letters, and
  // an overflowing word starts the simulation already clipped.
  const maxTotal = w * 0.82;
  if (total > maxTotal) {
    size *= maxTotal / total;
    font = `800 ${size}px ${face}`;
    ctx.font = font;
    widths = chars.map((c) => ctx.measureText(c).width);
    total = widths.reduce((a, b) => a + b, 0);
  }

  let x = (w - total) / 2;
  const letters = [];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === ' ') { x += widths[i]; continue; }
    const hw = widths[i] / 2;
    const hh = size * 0.36;
    letters.push({
      ch: chars[i],
      x: x + hw, y: h * 0.42,
      hx: x + hw, hy: h * 0.42,
      hw, hh,
      vx: (i - chars.length / 2) * 2.5,
      vy: 0, a: 0, va: (Math.random() - 0.5) * 1.2,
    });
    x += widths[i];
  }

  return {
    letters, font,
    ink: cssVar(canvas, '--text', '#111'),
    muted: cssVar(canvas, '--text-3', '#999'),
    dropped: false,
  };
}

function reset(state) {
  for (const l of state.letters) {
    l.x = l.hx; l.y = l.hy;
    l.vx = 0; l.vy = 0; l.a = 0; l.va = (Math.random() - 0.5) * 1.2;
  }
  state.dropped = false;
}

/** Separate two overlapping boxes along the shallower axis. */
function separate(a, b, bounce) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ox = a.hw + b.hw - Math.abs(dx);
  if (ox <= 0) return;
  const oy = a.hh + b.hh - Math.abs(dy);
  if (oy <= 0) return;

  if (ox < oy) {
    const s = (dx < 0 ? -1 : 1) * ox * 0.5;
    a.x -= s; b.x += s;
    const v = (a.vx - b.vx) * bounce;
    a.vx -= v * 0.5; b.vx += v * 0.5;
  } else {
    const s = (dy < 0 ? -1 : 1) * oy * 0.5;
    a.y -= s; b.y += s;
    const v = (a.vy - b.vy) * bounce;
    a.vy -= v * 0.5; b.vy += v * 0.5;
  }
}

function cssVarCache(state, name) {
  return name === '--text-3' ? state.muted : state.ink;
}
