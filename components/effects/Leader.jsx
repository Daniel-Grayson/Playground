'use client';

import { useEffect, useRef } from 'react';
import { Leader as Engine } from '@/lib/leader/engine';

/**
 * Leader — an academy countdown. Each numeral falls in, holds, rushes the
 * lens until it overruns the frame, then tumbles out for the next one.
 *
 * Runs its own loop rather than the shared useCanvas engine: it steps a tick
 * counter against a fixed 30fps timeline rather than integrating dt, and it
 * stretches its own hold while the pointer rests on it.
 */
export default function Leader() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let engine = null;
    let onScreen = false;
    let hidden = false;

    const sync = () => {
      if (!engine || reduced) return;
      if (onScreen && !hidden) engine.start();
      else engine.stop();
    };

    // One frame's delay so the card has been laid out and measured.
    const raf = requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      engine = new Engine(canvas);
      if (!engine.ok) return;
      if (reduced) engine.renderStill();
      else sync();
    });

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // Never preventDefault here: the lean is decoration, and a finger
      // dragging across the card must still scroll the page.
      engine?.setPointer(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        ((e.clientY - r.top) / r.height) * 2 - 1,
      );
    };
    const onLeave = () => engine?.clearPointer();

    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave, { passive: true });
    canvas.addEventListener('pointercancel', onLeave, { passive: true });
    canvas.addEventListener('pointerup', onLeave, { passive: true });

    const io = new IntersectionObserver((es) => {
      onScreen = es[0]?.isIntersecting ?? false;
      sync();
    }, { threshold: 0.2 });
    io.observe(canvas);

    const onVis = () => { hidden = document.hidden; sync(); };
    document.addEventListener('visibilitychange', onVis);

    const ro = new ResizeObserver(() => engine?.resize());
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointercancel', onLeave);
      canvas.removeEventListener('pointerup', onLeave);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      engine?.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="A film leader counting a reel in. A head card reading Picture Start falls in from above, holds still, then rushes toward you until it overruns the frame and tumbles away; the numerals eight down to two follow it in turn, each on film stock that flips between black on bone and bone on black. Resting the pointer on the card holds the current number longer."
    />
  );
}
