'use client';

import { useMemo } from 'react';

/**
 * Squircle — the corner Apple uses.
 *
 * A rounded rectangle is a straight line that becomes a circular arc at a
 * point. Curvature jumps from 0 to 1/r instantly there, and the eye reads
 * that discontinuity as a kink even when it cannot name it.
 *
 * A superellipse  |x/a|^n + |y/b|^n = 1  has curvature that rises smoothly
 * from the flat edge into the corner, so there is nothing to catch on. n is
 * the only dial: 2 is a plain ellipse, around 4 is the iOS corner, and large
 * n converges on a rectangle.
 *
 * Solving for y and sampling gives a path usable as clip-path, which means
 * this works on any element with no canvas and no library.
 */
export function squirclePath(n = 4, steps = 64) {
  const pts = [];
  // Sample one quadrant, then mirror — the shape is symmetric in both axes.
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t;
    // |x|^n + |y|^n = 1  ->  y = (1 - x^n)^(1/n)
    const y = Math.pow(Math.max(0, 1 - Math.pow(x, n)), 1 / n);
    pts.push([x, y]);
  }

  const quad = pts.map(([x, y]) => [50 + x * 50, 50 - y * 50]);
  const ring = [
    ...quad,
    ...quad.slice(0, -1).reverse().map(([x, y]) => [x, 100 - y]),
    ...quad.slice(1).map(([x, y]) => [100 - x, 100 - y]),
    ...quad.slice(0, -1).reverse().map(([x, y]) => [100 - x, y]),
  ];

  return `polygon(${ring.map(([x, y]) => `${x.toFixed(3)}% ${y.toFixed(3)}%`).join(', ')})`;
}

export default function Squircle({ n = 4, compare = true, label = 'n' }) {
  const clip = useMemo(() => squirclePath(n), [n]);

  const tile = {
    width: 'min(34%, 150px)',
    aspectRatio: '1',
    display: 'grid',
    placeItems: 'center',
    fontFamily: 'var(--mono)',
    fontSize: 11,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  };

  return (
    <div
      style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 'clamp(12px, 4%, 36px)', padding: 20, flexWrap: 'wrap',
      }}
    >
      {compare && (
        <div style={{ ...tile, background: 'var(--border-strong)', color: 'var(--bg)', borderRadius: '28%' }}>
          border-radius
        </div>
      )}
      <div style={{ ...tile, background: 'var(--text)', color: 'var(--bg)', clipPath: clip }}>
        {label} = {Number(n).toFixed(1)}
      </div>
    </div>
  );
}
