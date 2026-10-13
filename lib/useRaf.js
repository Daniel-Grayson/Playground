'use client';

import { useEffect, useRef } from 'react';

/**
 * rAF loop for DOM-based components. Same courtesies as useCanvas: pauses
 * when the element is offscreen or the tab is hidden, and renders a single
 * frame under prefers-reduced-motion instead of animating.
 */
export function useRaf(cb, { deps = [] } = {}) {
  const elRef = useRef(null);
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const el = elRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      cbRef.current({ t: 0, dt: 0, reduced: true });
      return undefined;
    }

    let raf = 0;
    let last = 0;
    let t = 0;
    let visible = false;

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      last = now;
      t += dt;
      cbRef.current({ t, dt });
    };
    const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { rootMargin: '150px' });
    if (el) io.observe(el); else start();

    const onVis = () => { if (document.hidden) stop(); else if (visible) start(); };
    document.addEventListener('visibilitychange', onVis);

    return () => { stop(); io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return elRef;
}
