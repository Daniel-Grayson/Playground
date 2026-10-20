'use client';

import { useEffect, useRef } from 'react';
import { WordWheel as Engine } from '@/lib/wheel/engine';

/**
 * Wheel — a ring of words fanned round a centre off the left edge. It
 * drifts on its own; moving the pointer up or down flicks it round.
 */
export default function WordWheel() {
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
    // Spinning is only ever done on purpose: press, turn, let go.
    const onDown = (e) => {
      if (reduced || !engine) return;
      const r = canvas.getBoundingClientRect();
      engine.press(e.clientX - r.left, e.clientY - r.top);
      canvas.setPointerCapture?.(e.pointerId);
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    };
    const onUp = () => {
      engine?.release();
      canvas.style.cursor = 'grab';
    };
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave, { passive: true });
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp, { passive: true });
    canvas.addEventListener('pointercancel', onUp, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      engine?.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="A dial of words on black, each word set along its own spoke of a large ring whose centre is off the left edge: Fibroscan, Haematocrit, Gamma-GT, Apolipoprotein B and others, all small and white. The ring turns steadily; the word under the pointer grows and turns orange, and pressing and dragging round the ring spins it, flinging it faster."
    />
  );
}
