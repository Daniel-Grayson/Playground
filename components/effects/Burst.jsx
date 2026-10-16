'use client';

import { useEffect, useRef } from 'react';
import { RayBurst as Engine } from '@/lib/burst/engine';

/**
 * Burst — a ring of stepped rays round an empty centre, evenly spaced and
 * moving in unison: they breathe in and out together while the ring turns.
 * Pointer movement speeds both up.
 */
export default function RayBurst() {
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
      aria-label="Orange rays on a dark brown ground, each a thick bar stepping down to a hairline needle, all pointing in at an empty circle in the middle. All the rays move together: they push in toward the centre and draw back out like an iris while the ring turns slowly, faster when the pointer moves."
    />
  );
}
