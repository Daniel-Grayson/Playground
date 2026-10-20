'use client';

import { useEffect, useRef } from 'react';
import { PostCities as Engine } from '@/lib/post/engine';

/**
 * Post — a sheet of city stamps, real photographs graded into one ink. Pick one up and put it anywhere;
 * nothing moves unless it is being moved.
 */
export default function PostCities() {
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

    const at = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onMove = (e) => {
      if (!engine) return;
      const [x, y] = at(e);
      engine.setPointer(x, y);
      canvas.style.cursor = engine.cursor(x, y);
      if (reduced) engine.renderStill();
    };
    const onDown = (e) => {
      if (!engine) return;
      const [x, y] = at(e);
      if (!engine.press(x, y)) return;
      e.preventDefault();
      canvas.setPointerCapture?.(e.pointerId);
      canvas.style.cursor = 'grabbing';
      if (reduced) engine.renderStill();
    };
    const onUp = (e) => {
      if (!engine) return;
      engine.release();
      const [x, y] = at(e);
      canvas.style.cursor = engine.cursor(x, y);
      if (reduced) engine.renderStill();
    };
    const onLeave = () => engine?.clearPointer();
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp, { passive: true });
    canvas.addEventListener('pointercancel', onUp, { passive: true });
    canvas.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      engine?.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="An album page of loose postage stamps, each a photograph of a city printed in one colour: New York, Paris, Rio, Tokyo, Istanbul, Sydney, London and Cairo. Press on a stamp to pick it up and move it anywhere on the page; it lifts, squares up and casts a longer shadow, and stays on top of the pile where it is put down."
    />
  );
}
