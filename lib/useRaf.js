'use client';

import { useEffect, useRef } from 'react';

/**
 * rAF loop for DOM-based effects (no canvas). Same courtesies as useCanvas:
 * pauses when the element is offscreen or the tab is hidden, and skips the
 * loop entirely under prefers-reduced-motion.
 *
 * @param {Function} cb  ({ t, dt, frame }) => void
 * @param {object}   opts
 * @param {Array}    opts.deps
 * @param {boolean}  opts.respectReducedMotion
 * @returns {import('react').RefObject} ref to attach to the observed element
 */
export function useRaf(cb, { deps = [], respectReducedMotion = true } = {}) {
  const elRef = useRef(null);
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const el = elRef.current;
    const reduced =
      respectReducedMotion &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      cbRef.current({ t: 0, dt: 0, frame: 0, reduced: true });
      return;
    }

    let raf = 0;
    let last = 0;
    let t = 0;
    let frame = 0;
    let visible = true;

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      last = now;
      t += dt;
      cbRef.current({ t, dt, frame: frame++ });
    };

    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    let io;
    if (el) {
      io = new IntersectionObserver(
        ([e]) => {
          visible = e.isIntersecting;
          if (visible && !document.hidden) start();
          else stop();
        },
        { rootMargin: '120px' },
      );
      io.observe(el);
    } else {
      start();
    }

    const onVis = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return elRef;
}
