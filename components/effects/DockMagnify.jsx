'use client';

import { useRef } from 'react';

/**
 * Dock magnify — the macOS dock curve.
 *
 * The icon under the cursor is not the only one that grows: its neighbours
 * grow by a falling amount, which is what makes the row bulge as one surface
 * instead of popping one tile at a time. The falloff is a raised cosine over
 * a fixed radius in icon-widths — the same shape Apple uses.
 *
 * Written straight to style on pointermove rather than through React state:
 * this runs on every mouse event, and a re-render per event is far too slow.
 */
const ICONS = ['◉', '◳', '◈', '⌁', '◍', '⊞', '◐', '✦'];

export default function DockMagnify({ magnify = 1.75, radius = 2.2, size = 44 }) {
  const rowRef = useRef(null);
  const refs = useRef([]);

  const apply = (clientX) => {
    const row = rowRef.current;
    if (!row) return;
    const r = row.getBoundingClientRect();
    refs.current.forEach((el) => {
      if (!el) return;
      const b = el.getBoundingClientRect();
      const centre = b.left + b.width / 2 - r.left;
      const d = Math.abs((clientX - r.left) - centre) / size;
      // Raised cosine: 1 at the cursor, 0 at the edge of the radius.
      const f = d >= radius ? 0 : 0.5 * (1 + Math.cos((d / radius) * Math.PI));
      const s = 1 + (magnify - 1) * f;
      el.style.transform = `translateY(${(-(s - 1) * size * 0.45).toFixed(2)}px) scale(${s.toFixed(3)})`;
    });
  };

  const reset = () => {
    refs.current.forEach((el) => { if (el) el.style.transform = 'translateY(0) scale(1)'; });
  };

  return (
    <div className="dock-wrap" onPointerLeave={reset}>
      <div
        className="dock"
        ref={rowRef}
        onPointerMove={(e) => apply(e.clientX)}
        style={{ '--icon': `${size}px` }}
      >
        {ICONS.map((g, i) => (
          <span
            key={g}
            className="dock-icon"
            ref={(el) => { refs.current[i] = el; }}
            data-i={i}
            aria-hidden="true"
          >
            {g}
          </span>
        ))}
      </div>
      <div className="dock-shelf" aria-hidden="true" />
    </div>
  );
}
