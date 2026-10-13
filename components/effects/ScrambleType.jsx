'use client';

import { useRef, useState } from 'react';
import { useRaf } from '@/lib/useRaf';
import { rng } from '@/lib/math';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}=+*#%@&$';

/**
 * Scramble type — text resolving out of noise.
 *
 * Each character is assigned a reveal time up front. Before its turn it shows
 * a random glyph, reseeded a few times a second rather than every frame — at
 * 60fps the churn is so fast it reads as grey mush, so slowing the reseed is
 * what makes it look like characters rather than static.
 *
 * The rendered span keeps the real text in aria-label and hides the scramble
 * from assistive tech, so it stays readable to a screen reader throughout.
 */
export default function ScrambleType({
  text = 'SCRAMBLE',
  speed = 1,
  stagger = 0.6,
  reseedHz = 14,
  loop = true,
  holdSeconds = 1.6,
}) {
  const [display, setDisplay] = useState(text);
  const plan = useRef(null);

  const ref = useRaf(
    ({ t, reduced }) => {
      if (reduced) {
        setDisplay(text);
        return;
      }

      const chars = [...text];
      const duration = 1.1 / Math.max(0.1, speed);
      const spread = duration * stagger;
      const cycle = duration + spread + holdSeconds;

      if (!plan.current || plan.current.text !== text) {
        // Deterministic reveal order per word, so a re-render doesn't reshuffle.
        const r = rng(hash(text));
        plan.current = {
          text,
          offsets: chars.map(() => r() * spread),
          seeds: chars.map(() => Math.floor(r() * 1e6)),
        };
      }

      const local = loop ? t % cycle : Math.min(t, cycle);
      const bucket = Math.floor(local * reseedHz);
      const { offsets, seeds } = plan.current;

      let out = '';
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (ch === ' ') {
          out += ' ';
          continue;
        }
        if (local >= offsets[i] + duration) {
          out += ch;
        } else {
          const r = rng(seeds[i] + bucket * 31);
          out += CHARSET[Math.floor(r() * CHARSET.length)];
        }
      }
      setDisplay((prev) => (prev === out ? prev : out));
    },
    { deps: [text, speed, stagger, reseedHz, loop, holdSeconds] },
  );

  return (
    <div
      ref={ref}
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '100%',
        height: '100%',
        padding: '24px',
        // Size the type against THIS box, not the viewport: the same component
        // sits in a 260px gallery card and in a full-width stage.
        containerType: 'inline-size',
      }}
    >
      <span
        aria-label={text}
        style={{
          fontFamily: 'var(--mono)',
          fontWeight: 600,
          fontSize: 'clamp(14px, 13cqw, 62px)',
          letterSpacing: '0.04em',
          color: 'var(--text)',
          whiteSpace: 'pre',
          maxWidth: '100%',
          // Stops the line reflowing as glyph widths change mid-scramble.
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span aria-hidden="true">{display}</span>
      </span>
    </div>
  );
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
