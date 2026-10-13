'use client';

import { useCanvas } from '@/lib/useCanvas';
import { renderText } from '@/lib/text';
import { cssVar } from '@/lib/css';
import { damp } from '@/lib/math';

/**
 * Shatter type — the word breaks apart under the cursor, then crawls home.
 *
 * The word is rendered once and cut into a grid of tiles. A tile is just a
 * source rectangle plus a home position; the pointer applies an inverse-square
 * shove and a spring pulls it back. Nothing re-renders text per frame, so the
 * cost is one clipped drawImage per tile.
 */
export default function ShatterType({
  text = 'SHATTER',
  tiles = 26,
  force = 1,
  springback = 0.18,
  spin = 1,
}) {
  const ref = useCanvas({
    deps: [text, tiles, force, springback, spin],

    init: ({ canvas, w, h }) => buildState(canvas, w, h, text, tiles),
    resize: ({ canvas, w, h, state }) => {
      Object.assign(state, buildState(canvas, w, h, text, tiles));
    },

    frame: ({ ctx, w, h, dpr, dt, state, pointer }) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const { src, cells, cw, ch } = state;
      const px = pointer.inside ? pointer.x : -9999;
      const py = pointer.inside ? pointer.y : -9999;
      const reach = Math.min(w, h) * 0.42;

      for (const c of cells) {
        // Inverse-square-ish push, clamped so a tile under the cursor doesn't
        // get flung to infinity.
        const dx = c.x - px;
        const dy = c.y - py;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2) || 1;
        if (d < reach) {
          const falloff = 1 - d / reach;
          const push = falloff * falloff * force * 2600;
          c.vx += (dx / d) * push * dt;
          c.vy += (dy / d) * push * dt;
          c.va += (dx / d) * push * dt * 0.0012 * spin;
        }

        // Spring home + damping. springback is a half-life in seconds, so the
        // feel is identical at 60 and 120fps.
        c.vx += (c.hx - c.x) * (1 / springback) * dt * 6;
        c.vy += (c.hy - c.y) * (1 / springback) * dt * 6;
        c.vx = damp(c.vx, 0, 0.12, dt);
        c.vy = damp(c.vy, 0, 0.12, dt);
        c.va = damp(c.va, 0, 0.16, dt);

        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.a = damp(c.a + c.va * dt, 0, 0.5, dt);

        const moved = Math.hypot(c.x - c.hx, c.y - c.hy);

        ctx.save();
        ctx.translate(c.x, c.y);
        if (c.a) ctx.rotate(c.a);
        // Shards lift slightly as they fly, which sells the depth.
        const s = 1 + Math.min(moved / 300, 0.35);
        if (s !== 1) ctx.scale(s, s);
        ctx.globalAlpha = Math.max(0.15, 1 - moved / (reach * 1.8));
        ctx.drawImage(src, c.sx, c.sy, cw, ch, -cw / 2, -ch / 2, cw, ch);
        ctx.restore();
      }
    },
  });

  return <canvas ref={ref} aria-label={`The word ${text}, shattering away from the pointer`} role="img" />;
}

function buildState(canvas, w, h, text, tiles) {
  const src = renderText(text, {
    width: Math.max(w, 2),
    height: Math.max(h, 2),
    color: cssVar(canvas, '--text', '#111'),
    weight: 800,
    letterSpacing: 0.01,
    padding: 0.16,
  });

  const cols = Math.max(4, Math.round(tiles));
  const cw = src.width / cols;
  const ch = cw; // square tiles
  const rows = Math.max(1, Math.ceil(src.height / ch));

  const cells = [];
  const img = src.getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, src.width, src.height).data;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const sx = col * cw;
      const sy = r * ch;
      if (!hasInk(img, src.width, src.height, sx, sy, cw, ch)) continue; // skip empty tiles
      const hx = sx + cw / 2;
      const hy = sy + ch / 2;
      cells.push({ sx, sy, hx, hy, x: hx, y: hy, vx: 0, vy: 0, a: 0, va: 0 });
    }
  }
  return { src, cells, cw, ch };
}

/** Cheap occupancy test so we never animate blank tiles. */
function hasInk(data, iw, ih, sx, sy, cw, ch) {
  const stepX = Math.max(1, Math.floor(cw / 4));
  const stepY = Math.max(1, Math.floor(ch / 4));
  for (let y = sy; y < Math.min(sy + ch, ih); y += stepY) {
    for (let x = sx; x < Math.min(sx + cw, iw); x += stepX) {
      if (data[((y | 0) * iw + (x | 0)) * 4 + 3] > 16) return true;
    }
  }
  return false;
}
