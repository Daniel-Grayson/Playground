'use client';

import { useEffect, useRef } from 'react';
import { LoomDamask as Engine } from '@/lib/loom/engine';

/**
 * Loom — damask. The word is a change of float length in a five-end satin,
 * woven in the same two threads as the ground.
 */
export default function LoomDamask() {
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
      aria-label="A close weave of two threads. A word sits in the cloth, visible only because inside the letters the weave turns over: the ground shows long vertical floats of the darker thread while the letters show long horizontal floats of the lighter one. Every couple of seconds the weave steps through intermediate states until inside and outside are identical and the word is gone, a new word and colourway arrive in that blank moment, and the contrast steps back up. A raking light travels slowly across the surface, and the pointer brings a soft highlight with it."
    />
  );
}
