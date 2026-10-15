'use client';

import { useEffect, useRef } from 'react';
import { MarbleBath as Engine } from '@/lib/marble/engine';

/**
 * Marble — suminagashi by exact closed-form point transforms. Drops, a rake,
 * a comb, and a drop of clear water that wipes the sheet for the next one.
 */
export default function MarbleBath() {
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

    const raf = requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      engine = new Engine(canvas);
      if (!engine.ok) return;
      if (reduced) engine.renderStill();
      else sync();
    });

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
      aria-label="A sheet of marbled paper being made. Drops of ink land on water one after another, each pushing the last outward into a concentric ring, until the surface is full. A rake drags across them, then a comb pulls through at right angles and turns the rings into rows of feathers. The finished sheet holds for a moment before a disc of clear water opens at the centre and spreads, driving all the ink off the edges, and the next sheet begins in new colours."
    />
  );
}
