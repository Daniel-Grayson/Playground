'use client';

import { useEffect, useRef } from 'react';
import { FloodType as Engine } from '@/lib/flood/engine';

/**
 * Flood type — a two-line wordmark falls in, holds, rushes the camera until
 * it overruns the frame, then tumbles out so the next word can arrive.
 *
 * Runs its own loop rather than the shared useCanvas engine: it steps a tick
 * counter against a fixed 30fps timeline rather than integrating dt, and it
 * stretches its own hold while the pointer rests on it.
 */
export default function FloodType() {
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
      aria-label="A two-line wordmark falls in from above, holds still, then rushes toward you until it overruns the frame with every letter turned to its own angle, before tumbling out of the bottom so the next word can arrive."
    />
  );
}
