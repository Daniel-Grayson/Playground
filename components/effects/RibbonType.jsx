'use client';

import { useCanvas } from '@/lib/useCanvas';
import { renderText } from '@/lib/text';
import { cssVar } from '@/lib/css';
import { TAU, clamp } from '@/lib/math';

/**
 * Ribbon type — a word twisting like a strip of paper.
 *
 * The word is rendered once to an offscreen bitmap, then redrawn as vertical
 * slices. Each slice is rotated about the horizontal axis running through the
 * word — the ribbon's spine — by a sine wave travelling along its length.
 *
 * Rotating a flat strip about that axis means its projected HEIGHT is
 * cos(angle), and the light it catches is the same cosine. So one number per
 * slice gives the geometry and the shading at once, and the word reads as a
 * strip of paper turning over rather than as letters being squeezed.
 */
export default function RibbonType({
  text = 'RIBBON',
  twist = 1.1,
  speed = 0.5,
  slices = 180,
  wavelength = 1.6,
}) {
  const ref = useCanvas({
    deps: [text, twist, speed, slices, wavelength],

    init: ({ canvas, w, h }) => ({
      src: renderText(text, {
        width: Math.max(w, 2),
        height: Math.max(h, 2),
        color: cssVar(canvas, '--text', '#111'),
        weight: 800,
        letterSpacing: 0.02,
        padding: 0.14,
      }),
      ink: cssVar(canvas, '--text', '#111'),
      fade: bgRgba(canvas),
    }),

    resize: ({ canvas, w, h, state }) => {
      state.fade = bgRgba(canvas);
      state.src = renderText(text, {
        width: Math.max(w, 2),
        height: Math.max(h, 2),
        color: cssVar(canvas, '--text', '#111'),
        weight: 800,
        letterSpacing: 0.02,
        padding: 0.14,
      });
    },

    frame: ({ ctx, w, h, dpr, t, state, pointer }) => {
      const { src } = state;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const n = Math.max(8, Math.round(slices));
      const sliceW = src.width / n;
      const destW = w / n;
      const phase = t * speed * TAU;

      // The pointer leans the ribbon by shifting the wave's phase.
      const lean = pointer.inside ? pointer.nx * 1.1 : 0;

      for (let i = 0; i < n; i++) {
        const u = i / n;
        const angle = Math.sin(phase + u * TAU * wavelength + lean) * twist;
        const c = Math.cos(angle);
        const facing = Math.abs(c);

        const dh = facing * h;
        if (dh < 0.6) continue; // edge-on: the strip is invisible from here

        const dx = i * destW;
        // Lift the slice as it turns, so the twist travels in depth too.
        const dy = (h - dh) / 2 + Math.sin(angle) * h * 0.05;

        ctx.save();
        ctx.beginPath();
        ctx.rect(dx - 0.5, 0, destW + 1, h);
        ctx.clip();

        if (c < 0) {
          // Seeing the back of the strip: flip it vertically.
          ctx.translate(0, dy + dh / 2);
          ctx.scale(1, -1);
          ctx.translate(0, -(dy + dh / 2));
        }
        ctx.drawImage(src, i * sliceW, 0, sliceW, src.height, dx, dy, destW + 1, dh);
        ctx.restore();

        // Shade with the same cosine. Darkening near-black type would be
        // invisible, so instead fade the slice toward the page background:
        // edge-on slices thin out, which is what makes the turn legible.
        // The back of the strip carries a constant extra fade.
        const shade = c < 0
          ? 0.3 + (1 - facing) * 0.55
          : (1 - facing) * 0.62;
        if (shade > 0.002) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(dx - 0.5, 0, destW + 1, h);
          ctx.clip();
          ctx.globalCompositeOperation = 'source-atop';
          ctx.fillStyle = state.fade.replace('ALPHA', clamp(shade, 0, 1).toFixed(3));
          ctx.fillRect(dx - 0.5, 0, destW + 1, h);
          ctx.restore();
        }
      }
    },
  });

  return <canvas ref={ref} aria-label={`The word ${text} twisting like a ribbon`} role="img" />;
}

/** The page background as an rgba template, for fading slices into it. */
function bgRgba(canvas) {
  let h = cssVar(canvas, '--bg', '#ffffff').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  const rgb = Number.isNaN(n)
    ? '255,255,255'
    : `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  return `rgba(${rgb}, ALPHA)`;
}
