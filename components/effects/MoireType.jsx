'use client';

import { useEffect, useRef } from 'react';
import { MoireType as Engine } from '@/lib/moire/engine';

/**
 * Moiré type — the word is never drawn. It exists only where a second ruling
 * disagrees with the first, and vanishes when they agree.
 *
 * Display only.
 */
export default function MoireType() {
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
      aria-label="A field ruled edge to edge with parallel lines. A word appears inside it, made only of lines running at a different angle and spacing, so the letterforms are visible purely as interference. The two rulings drift back into agreement, the word disappears into the flat field, and the next word and palette arrive."
    />
  );
}
