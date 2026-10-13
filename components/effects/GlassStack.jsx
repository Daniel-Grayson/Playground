'use client';

import { useRef, useState } from 'react';
import { useRaf } from '@/lib/useRaf';

/**
 * Glass stack — frosted plates floating apart in isometric.
 *
 * The depth is a cheat: there is no 3D. Each plate is a square skewed into a
 * rhombus by one matrix, and the stack is just the same rhombus repeated with
 * a vertical offset. Since the browser composites those transforms, a stack
 * of eight costs about as much as one.
 *
 * Plates breathe apart on their own and spread further under the pointer,
 * each on its own delay so the stack unfolds rather than jumping.
 */
export default function GlassStack({ plates = 6, gap = 26, speed = 0.5 }) {
  const refs = useRef([]);
  const [hot, setHot] = useState(false);
  const n = Math.max(2, Math.min(plates, 10));

  const root = useRaf(({ t }) => {
    for (let i = 0; i < n; i++) {
      const el = refs.current[i];
      if (!el) continue;
      const k = i - (n - 1) / 2;
      const breathe = Math.sin(t * speed + i * 0.42) * 4;
      const spread = hot ? gap * 1.7 : gap;
      el.style.transform =
        `translate3d(0, ${(k * spread + breathe).toFixed(2)}px, 0) ` +
        `matrix(1, 0.52, -1, 0.52, 0, 0)`;
      el.style.opacity = String(0.42 + (i / n) * 0.5);
    }
  }, { deps: [n, gap, speed, hot] });

  return (
    <div
      ref={root}
      className="stack"
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
    >
      <div className="stack-inner">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="stack-plate" ref={(el) => { refs.current[i] = el; }}>
            <span className="stack-emboss" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
}
