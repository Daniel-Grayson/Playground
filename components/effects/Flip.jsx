'use client';

import { useEffect, useRef } from 'react';
import { StickerFlip as Engine } from '@/lib/flip/engine';

/**
 * Flip — a sticker flipbook. One sticker at a time on a dark ground, hard
 * cutting to the next; the pointer's position sets the beat.
 */
export default function StickerFlip() {
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
      const r = canvas.getBoundingClientRect();
      engine.setPointer(e.clientX - r.left, e.clientY - r.top);
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
      aria-label="A sticker flipbook on a dark maroon ground: one die-cut sticker at a time in the centre, cutting sharply to the next on a steady beat. Moving the pointer left slows the flipping and moving it right speeds it up."
    />
  );
}
