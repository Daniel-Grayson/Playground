'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Cascade menu — a nested picker that opens itself.
 *
 * Two things make a submenu feel right. Rows reveal on a stagger rather than
 * the panel appearing whole, so the eye follows the list down. And the second
 * panel is anchored to the row that spawned it, not to the panel, so it
 * always points back at what you chose.
 *
 * It plays a loop by itself — open, walk down, branch, settle — and hands
 * control over the moment you touch it, which is how a demo earns its place
 * in a grid of cards nobody is hovering.
 */
const AGENTS = ['Claude Code', 'Codex', 'OpenCode', 'Cursor', 'Amp', 'Grok Build'];
const MODELS = ['Auto', 'Opus 5', 'Sonnet 5.5', 'Haiku 5.5'];
const BRANCH_AT = 3; // Cursor

export default function CascadeMenu({ loop = true }) {
  const [step, setStep] = useState(0);      // drives the idle performance
  const [hover, setHover] = useState(null); // user takes over
  const live = useRef(false);

  // Idle loop: reveal rows, run the cursor down, branch, hold, reset.
  useEffect(() => {
    if (!loop) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setStep(AGENTS.length + 2); return undefined; }
    const id = setInterval(() => {
      if (live.current) return;             // paused while the pointer is in
      setStep((s) => (s + 1) % (AGENTS.length + 6));
    }, 520);
    return () => clearInterval(id);
  }, [loop]);

  const selected = hover ?? (step > BRANCH_AT && step <= AGENTS.length + 2 ? BRANCH_AT : null);
  const open = hover !== null || step >= 1;
  const branched = selected === BRANCH_AT;

  return (
    <div
      className="cascade"
      onPointerEnter={() => { live.current = true; }}
      onPointerLeave={() => { live.current = false; setHover(null); }}
    >
      <div className="cas-trigger" aria-hidden="true">
        <span className="cas-dot" /> Multiple agents
        <span className="cas-caret">⌃⌄</span>
      </div>

      <div className="cas-row">
        <div className="cas-panel" data-open={open ? 'true' : undefined}>
          <div className="cas-filter">Filter agents…</div>
          {AGENTS.map((a, i) => (
            <button
              key={a}
              type="button"
              className="cas-item"
              data-on={selected === i ? 'true' : undefined}
              // Rows arrive on a stagger instead of the panel appearing whole.
              style={{ '--d': `${i * 45}ms`, opacity: hover !== null || step > i ? 1 : 0 }}
              onPointerEnter={() => setHover(i)}
            >
              <span className="cas-ico" aria-hidden="true">◆</span>
              {a}
              {i === BRANCH_AT && <span className="cas-more">›</span>}
            </button>
          ))}
        </div>

        {/* Anchored to the branching row, so it points back at the choice. */}
        <div
          className="cas-panel cas-sub"
          data-open={branched ? 'true' : undefined}
          style={{ '--anchor': `${BRANCH_AT * 30 + 34}px` }}
        >
          <div className="cas-filter">Filter models…</div>
          {MODELS.map((m, i) => (
            <button
              key={m}
              type="button"
              className="cas-item"
              style={{ '--d': `${i * 50}ms` }}
            >
              <span className="cas-ico" aria-hidden="true">✳</span>
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
