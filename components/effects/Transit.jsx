'use client';

import { useEffect, useRef } from 'react';
import { Transit as Engine } from '@/lib/transit/engine';

/**
 * Transit — a waybill crossing a customs hall, in a new world each pass.
 * Four lines on inked bars hop in one axis at a time, park to be read, then
 * leave — and the next document arrives before the last has gone.
 *
 * Display only: no pointer, no controls.
 */
export default function Transit() {
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
      aria-label="A looping customs document. Four lines of a waybill — a route, a consignment number, a date and a status such as In Transit or Cleared — hop in from the edges one axis at a time, stopping at two or three stations on the way, and each stop leaves a flat stamped impression behind that vanishes after a moment. The lines park together long enough to be read, then leave by another route as the next document arrives."
    />
  );
}
