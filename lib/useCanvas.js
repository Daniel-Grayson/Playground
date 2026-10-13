'use client';

import { useEffect, useRef } from 'react';

/**
 * The engine every effect runs on.
 *
 * Handles the boring-but-easy-to-get-wrong parts once:
 *  - device-pixel-ratio backing store, so nothing renders blurry on retina
 *  - ResizeObserver instead of window resize, so effects work inside any layout
 *  - rAF loop that PAUSES when the canvas scrolls out of view or the tab hides,
 *    which is what keeps a page full of these from cooking a laptop fan
 *  - prefers-reduced-motion: renders a single static frame instead of animating
 *  - pointer state in CSS pixels, with velocity, already relative to the canvas
 *
 * @param {object}   opts
 * @param {'2d'|'webgl2'} [opts.context]
 * @param {Function} [opts.init]   ({ canvas, ctx, w, h, dpr }) => state
 * @param {Function} opts.frame    ({ ctx, w, h, dpr, t, dt, state, pointer, frame })
 * @param {Function} [opts.resize] ({ ctx, w, h, dpr, state })
 * @param {Function} [opts.dispose]({ state, ctx })
 * @param {Array}    [opts.deps]   re-initialise when these change
 */
export function useCanvas({
  context = '2d',
  contextAttrs,
  init,
  frame,
  resize,
  dispose,
  deps = [],
}) {
  const canvasRef = useRef(null);
  // Keep callbacks in a ref so a parent re-render never restarts the loop.
  const cbs = useRef({ init, frame, resize, dispose });
  cbs.current = { init, frame, resize, dispose };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext(context, contextAttrs);
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let elapsed = 0;
    let frameNo = 0;
    let visible = true;
    let state;
    let disposed = false;

    // Presses are queued, not sampled. A click whose down and up both land
    // between two animation frames would never be seen by a frame callback
    // reading a boolean, and fast taps really do fit inside 16ms.
    let pressQueue = 0;

    const pointer = {
      x: 0, y: 0,      // smoothed, CSS px relative to the canvas
      rawX: 0, rawY: 0, // unsmoothed
      vx: 0, vy: 0,     // velocity, CSS px per second
      inside: false,
      down: false,
      /** True once per press. Call it from frame() to handle clicks. */
      consumePress() {
        if (pressQueue <= 0) return false;
        pressQueue--;
        return true;
      },
      // Normalised -1..1, handy for shaders and tilt.
      get nx() { return w ? (this.x / w) * 2 - 1 : 0; },
      get ny() { return h ? (this.y / h) * 2 - 1 : 0; },
    };

    const applySize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2); // cap: 3x costs 2.25x the fill rate
      const nw = Math.max(1, Math.round(rect.width));
      const nh = Math.max(1, Math.round(rect.height));
      if (nw === w && nh === h && nextDpr === dpr) return false;
      w = nw;
      h = nh;
      dpr = nextDpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      return true;
    };

    applySize();
    state = cbs.current.init?.({ canvas, ctx, w, h, dpr }) ?? {};

    const ro = new ResizeObserver(() => {
      if (disposed) return;
      if (!applySize()) return;
      cbs.current.resize?.({ canvas, ctx, w, h, dpr, state });
      if (reduced || !visible) renderOnce();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduced) start();
        else stop();
      },
      { rootMargin: '120px' },
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible && !reduced) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // --- pointer ---------------------------------------------------------
    const movePointer = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.rawX = e.clientX - rect.left;
      pointer.rawY = e.clientY - rect.top;
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
      pointer.down = false;
    };
    const onDown = (e) => {
      movePointer(e);
      pointer.down = true;
      // Cap the queue so a held-down burst cannot pile up unbounded.
      pressQueue = Math.min(pressQueue + 1, 4);
    };
    const onUp = () => {
      pointer.down = false;
    };
    canvas.addEventListener('pointermove', movePointer, { passive: true });
    canvas.addEventListener('pointerenter', movePointer, { passive: true });
    canvas.addEventListener('pointerleave', onLeave, { passive: true });
    canvas.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });

    // --- loop ------------------------------------------------------------
    const step = (dt) => {
      // Smooth the pointer and derive velocity before handing it to the effect.
      const k = 1 - Math.pow(0.0005, dt);
      const nx = pointer.x + (pointer.rawX - pointer.x) * k;
      const ny = pointer.y + (pointer.rawY - pointer.y) * k;
      pointer.vx = dt > 0 ? (nx - pointer.x) / dt : 0;
      pointer.vy = dt > 0 ? (ny - pointer.y) / dt : 0;
      pointer.x = nx;
      pointer.y = ny;

      cbs.current.frame?.({
        canvas, ctx, w, h, dpr,
        t: elapsed,
        dt,
        state,
        pointer,
        frame: frameNo++,
      });
    };

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      // Clamp dt so a backgrounded tab doesn't resume with one giant leap.
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      last = now;
      elapsed += dt;
      step(dt);
    };

    const start = () => {
      if (raf || disposed) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const renderOnce = () => {
      elapsed = 0;
      step(1 / 60);
    };

    if (reduced) renderOnce();
    else start();

    return () => {
      disposed = true;
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', movePointer);
      canvas.removeEventListener('pointerenter', movePointer);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      cbs.current.dispose?.({ state, ctx });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return canvasRef;
}
