'use client';

import { useEffect, useRef } from 'react';
import { StampType as Engine } from '@/lib/stamp/engine';

/**
 * Stamp type — a kinetic-type poster loop that repeats in a new world each
 * pass. Four lines on flat bars fly in one axis at a time, park to be read,
 * then scatter — and the next palette flies in before the last has left.
 *
 * Display only: no pointer, no controls.
 */
export default function StampType() {
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
      aria-label="A looping kinetic-type poster. Four lines of type on flat highlight bars fly in from the edges in square hops, hold still to be read, then scatter off. Every moving line leaves chunky blocks of flat colour where it just was. Each pass repeats the choreography in a new palette with new words, and the passes overlap so their trails flood the screen as the colour changes."
    />
  );
}
