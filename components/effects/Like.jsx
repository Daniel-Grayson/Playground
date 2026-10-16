'use client';

import { useEffect, useRef } from 'react';
import { LikeConfetti as Engine } from '@/lib/like/engine';

/**
 * Like — a like button whose reaction is a burst of confetti that gathers
 * back into the heart. Press to like, press again to unlike.
 */
export default function LikeConfetti() {
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
    // Only the heart is the button: the hand shows over it and nowhere else.
    const onMove = (e) => {
      if (!engine) return;
      const [x, y] = at(e);
      canvas.style.cursor = engine.hits(x, y) ? 'pointer' : 'default';
    };
    const onLeave = () => { canvas.style.cursor = 'default'; };
    const onDown = (e) => {
      if (!engine) return;
      const [x, y] = at(e);
      if (!engine.hits(x, y)) return;
      engine.press(reduced);
      if (reduced) engine.renderStill();
    };
    canvas.addEventListener('pointerdown', onDown, { passive: true });
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      engine?.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="A grey outline heart on a light grey ground. Pressing the heart likes it: the heart is pulled in, a burst of pink, blue, purple and orange confetti breathes out and draws back in, and a filled pink heart lands in its place. After two seconds it returns to the outline."
    />
  );
}
