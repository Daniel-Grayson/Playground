'use client';

import { useRef, useState } from 'react';
import { useRaf } from '@/lib/useRaf';

/**
 * Morph tabs — an indicator that stretches as it travels.
 *
 * The pill tracks the active tab's rect on a spring. Its width takes an extra
 * term proportional to the spring's current velocity, so moving fast makes it
 * long and thin and arriving lets it snap back. That is squash-and-stretch,
 * lifted straight from hand animation: the deformation is what sells the
 * speed, not the speed itself.
 */
export default function MorphTabs({
  items = ['Work', 'Studies', 'Writing', 'About'],
  stiffness = 220,
  stretch = 0.3,
  damping = 0.8,
}) {
  const [active, setActive] = useState(0);
  const refs = useRef([]);
  const pill = useRef(null);
  const sim = useRef({ x: 0, w: 0, vx: 0, vw: 0, init: false });

  const root = useRaf(
    ({ dt }) => {
      const target = refs.current[active];
      const container = root.current;
      if (!target || !container) return;

      const cr = container.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      const tx = tr.left - cr.left;
      const tw = tr.width;

      const s = sim.current;
      if (!s.init) {
        s.x = tx; s.w = tw; s.init = true;
      }

      const k = stiffness;
      const c = 2 * Math.sqrt(k) * damping; // < 1 damping = a little overshoot
      s.vx += (-k * (s.x - tx) - c * s.vx) * dt;
      s.vw += (-k * (s.w - tw) - c * s.vw) * dt;
      s.x += s.vx * dt;
      s.w += s.vw * dt;

      // Stretch along the direction of travel, and lose a little height to
      // keep the apparent area roughly constant.
      const speed = Math.abs(s.vx);
      const grow = Math.min(speed * stretch * 0.01, 46);
      const squash = 1 - Math.min(speed * 0.00018, 0.16);

      if (pill.current) {
        pill.current.style.transform =
          `translate3d(${(s.x - grow / 2).toFixed(2)}px, 0, 0) scaleY(${squash.toFixed(3)})`;
        pill.current.style.width = `${Math.max(0, s.w + grow).toFixed(2)}px`;
      }
    },
    { deps: [active, stiffness, stretch, damping] },
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(8px, 4cqw, 20px)',
        // The same tab bar has to fit a 260px gallery card and a full stage,
        // so everything below sizes against this box rather than the viewport.
        containerType: 'inline-size',
      }}
    >
      <div
        ref={root}
        role="tablist"
        aria-label="Example sections"
        style={{
          position: 'relative',
          display: 'flex',
          gap: 4,
          padding: 5,
          borderRadius: 999,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          maxWidth: '100%',
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }}
      >
        <div
          ref={pill}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 5,
            bottom: 5,
            left: 0,
            borderRadius: 999,
            background: 'var(--text)',
            willChange: 'transform, width',
          }}
        />
        {items.map((label, i) => (
          <button
            key={label}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            type="button"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            style={{
              position: 'relative',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              padding: 'clamp(5px, 2.2cqw, 9px) clamp(7px, 4cqw, 16px)',
              borderRadius: 999,
              fontSize: 'clamp(9px, 3.4cqw, 14px)',
              fontWeight: 540,
              whiteSpace: 'nowrap',
              color: i === active ? 'var(--bg)' : 'var(--text-2)',
              transition: 'color 0.22s ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
