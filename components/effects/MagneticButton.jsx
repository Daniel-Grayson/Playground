'use client';

import { useRef, useState } from 'react';
import { useRaf } from '@/lib/useRaf';

/**
 * Magnetic button — leans toward the cursor, springs back when you miss.
 *
 * The spring is critically damped (damping = 2·sqrt(stiffness)), which is the
 * exact point where it settles fastest without overshooting. Under that it
 * wobbles; over it, it feels sluggish. Driving it from a spring rather than a
 * CSS transition also means an interrupted gesture blends instead of snapping.
 *
 * The label rides the same spring with a larger multiplier, and that small
 * parallax between body and text is what makes it read as a physical object
 * rather than a div being translated.
 */
export default function MagneticButton({
  label = 'Get in touch',
  pull = 0.42,
  stiffness = 170,
  parallax = 1.8,
  hitPadding = 60,
}) {
  const btn = useRef(null);
  const inner = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const [near, setNear] = useState(false);

  const root = useRaf(
    ({ dt }) => {
      const k = stiffness;
      const c = 2 * Math.sqrt(k); // critical damping
      const p = pos.current;
      const t = target.current;

      p.vx += (-k * (p.x - t.x) - c * p.vx) * dt;
      p.vy += (-k * (p.y - t.y) - c * p.vy) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (btn.current) {
        btn.current.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0)`;
      }
      if (inner.current) {
        const ix = p.x * (parallax - 1);
        const iy = p.y * (parallax - 1);
        inner.current.style.transform = `translate3d(${ix.toFixed(2)}px, ${iy.toFixed(2)}px, 0)`;
      }
    },
    { deps: [stiffness, parallax] },
  );

  const onMove = (e) => {
    const el = btn.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Only attract inside a padded hit area, so the pull has a clear edge.
    const inside =
      Math.abs(dx) < r.width / 2 + hitPadding && Math.abs(dy) < r.height / 2 + hitPadding;
    setNear(inside);
    target.current = inside ? { x: dx * pull, y: dy * pull } : { x: 0, y: 0 };
  };

  const reset = () => {
    setNear(false);
    target.current = { x: 0, y: 0 };
  };

  return (
    <div
      ref={root}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{
        width: '100%', height: '100%',
        display: 'grid', placeItems: 'center',
        touchAction: 'none',
      }}
    >
      <button
        ref={btn}
        type="button"
        onBlur={reset}
        style={{
          position: 'relative',
          padding: '18px 34px',
          borderRadius: 999,
          border: '1px solid var(--border-strong)',
          background: near ? 'var(--text)' : 'var(--surface)',
          color: near ? 'var(--bg)' : 'var(--text)',
          fontSize: 15,
          fontWeight: 560,
          letterSpacing: '-0.01em',
          cursor: 'pointer',
          willChange: 'transform',
          transition: 'background 0.25s ease, color 0.25s ease',
        }}
      >
        <span ref={inner} style={{ display: 'inline-block', willChange: 'transform' }}>
          {label}
        </span>
      </button>
    </div>
  );
}
