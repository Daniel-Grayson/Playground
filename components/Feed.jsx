'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import EffectLoader from './EffectLoader';
import { cardVars } from '@/lib/palette';

/**
 * The whole site: a column of cards, and a lightbox over the top of them.
 *
 * Opening an effect does not navigate. The column stays where it is, blurs
 * and washes out, and the effect comes forward on top of it — so you keep
 * your place and the page never reloads.
 */
export default function Feed({ effects }) {
  const [open, setOpen] = useState(null); // index, or null
  const lastFocus = useRef(null);
  const closeRef = useRef(null);

  const show = (i) => {
    lastFocus.current = document.activeElement;
    setOpen(i);
  };
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d) => setOpen((i) => (i === null ? i : (i + d + effects.length) % effects.length)),
    [effects.length],
  );

  // Keyboard: Escape closes, arrows walk the set.
  useEffect(() => {
    if (open === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close, step]);

  // Hold the page still behind the overlay, and keep the scrollbar's width so
  // the column underneath does not jump sideways as it opens.
  useEffect(() => {
    if (open === null) return undefined;
    const { body } = document;
    const prev = body.style.cssText;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    closeRef.current?.focus();
    return () => {
      body.style.cssText = prev;
      lastFocus.current?.focus?.();
    };
  }, [open]);

  const active = open === null ? null : effects[open];

  return (
    <>
      <div className="feed" data-dimmed={open !== null ? 'true' : undefined} aria-hidden={open !== null}>
        {effects.map((e, i) => {
          const vars = cardVars(e.card.bg, e.card.ink, e.card.ac);
          return (
            <section key={e.slug}>
              <button
                type="button"
                className="feed-card"
                onClick={() => show(i)}
                tabIndex={open === null ? 0 : -1}
                aria-label={`Open ${e.title}`}
                style={{
                  ...vars,
                  aspectRatio: e.aspect.replace('/', ' / '),
                  '--card-bg': e.card.bg,
                  '--card-line': vars['--border'],
                }}
              >
                <EffectLoader slug={e.slug} />
              </button>
              <div className="feed-label">
                <span className="feed-name">{e.title}</span>
                <span className="feed-tag">{e.tags[0]}</span>
              </div>
            </section>
          );
        })}
      </div>

      {active && (
        <div className="lb" role="dialog" aria-modal="true" aria-label={active.title}>
          <button className="lb-scrim" type="button" aria-label="Close" onClick={close} />

          <div className="lb-inner">
            <div
              className="lb-stage"
              style={{
                ...cardVars(active.card.bg, active.card.ink, active.card.ac),
                aspectRatio: active.aspect.replace('/', ' / '),
                background: active.card.bg,
              }}
            >
              {/* Keyed so switching entries tears the old canvas down cleanly. */}
              <EffectLoader key={active.slug} slug={active.slug} />
            </div>

            <div className="lb-text">
              <div className="lb-head">
                <h2 className="lb-title">{active.title}</h2>
                <span className="feed-tag">
                  {String(open + 1).padStart(2, '0')} / {String(effects.length).padStart(2, '0')}
                </span>
              </div>
              <p className="lb-how">{active.mechanism}</p>
              <div className="tags">
                {active.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
              </div>
            </div>
          </div>

          <div className="lb-nav">
            <button type="button" onClick={() => step(-1)} aria-label="Previous">{'‹'}</button>
            <button type="button" ref={closeRef} onClick={close} aria-label="Close">{'×'}</button>
            <button type="button" onClick={() => step(1)} aria-label="Next">{'›'}</button>
          </div>
        </div>
      )}
    </>
  );
}
