'use client';

import { useRef } from 'react';
import { useRaf } from '@/lib/useRaf';

/**
 * Integration orbit — service marks circling a product mark.
 *
 * The staple of every integrations section. Nodes sit at even angles on a
 * ring and counter-rotate, so each tile stays upright while the ring turns.
 * A pulse travels each spoke inward on its own offset, which is what makes
 * the diagram read as "data arriving here" rather than as decoration.
 *
 * Drawn as DOM rather than canvas: these are crisp tiles with real shadows,
 * and the browser composites transforms more cheaply than we could repaint.
 */
const NODES = ['◆', '✳', '●', '▲', '✦', '■'];

export default function IntegrationOrbit({ nodes = 6, speed = 0.1, pulse = 1 }) {
  const ringRef = useRef(null);
  const tileRefs = useRef([]);
  const spokeRefs = useRef([]);
  const n = Math.max(3, Math.min(nodes, 10));

  const root = useRaf(({ t }) => {
    const a = t * speed * 360;
    if (ringRef.current) ringRef.current.style.transform = `rotate(${a}deg)`;
    // A tile inherits the ring's rotation plus its own arm angle, so it has
    // to undo both or it sits permanently tilted by where it sits on the ring.
    tileRefs.current.forEach((el, i) => {
      if (el) el.style.transform = `rotate(${-(a + (i / n) * 360)}deg)`;
    });
    // One pulse per spoke, offset so they do not arrive together.
    spokeRefs.current.forEach((el, i) => {
      if (!el) return;
      const p = ((t * 0.45 * pulse + i / n) % 1);
      el.style.setProperty('--p', p.toFixed(3));
      el.style.opacity = String(0.25 + 0.75 * Math.sin(p * Math.PI));
    });
  }, { deps: [n, speed, pulse] });

  return (
    <div ref={root} className="orbit">
      <div className="orbit-ring" ref={ringRef}>
        {Array.from({ length: n }).map((_, i) => {
          const a = (i / n) * 360;
          return (
            <div key={i} className="orbit-arm" style={{ transform: `rotate(${a}deg)` }}>
              <span
                className="orbit-spoke"
                ref={(el) => { spokeRefs.current[i] = el; }}
              />
              <span
                className="orbit-tile"
                ref={(el) => { tileRefs.current[i] = el; }}
                aria-hidden="true"
              >
                {NODES[i % NODES.length]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="orbit-hub" aria-hidden="true" />
    </div>
  );
}
