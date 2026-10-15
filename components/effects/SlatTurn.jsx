'use client';

import { useEffect, useRef } from 'react';
import { SlatTurn as Engine } from '@/lib/slat/engine';

/**
 * Slat — a row of triangular prisms, three posters, one turning. The scene
 * change is projected width and nothing else.
 */
export default function SlatTurn() {
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

    const onMove = (e) => {
      if (reduced || !engine) return;
      engine.setPointer(e.clientX - canvas.getBoundingClientRect().left);
    };
    const onLeave = () => engine?.clearPointer();
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      engine?.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="A row of upright three-sided prisms, each face printed with a different poster: OPEN in navy on cream, SHUT in yellow on blue, TURN in cream on pink. The row turns together. At three points in the rotation a single face squares up to you and its poster fills the card cleanly; between those points two posters are interleaved in alternating vertical bands, one face lit and one in shadow. Moving the pointer left and right nudges the turn."
    />
  );
}
