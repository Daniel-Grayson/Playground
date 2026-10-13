// Per-card palettes.
//
// Every effect reads its colours from CSS custom properties on its own
// element (cssVar(canvas, '--text') and friends), and custom properties
// inherit. So giving a card its own --bg/--text set re-skins the effect
// inside it with no prop plumbing and no change to the effect itself.

/** Blend two hex colours. t = 0 returns a, t = 1 returns b. */
export function mix(a, b, t) {
  const pa = hex(a);
  const pb = hex(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function hex(h) {
  let s = String(h).replace('#', '').trim();
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Derive the full token set a card needs from just a background and an ink.
 * Mid tones are blended rather than hand-picked so a new palette entry only
 * ever needs two colours.
 */
export function cardVars(bg, ink) {
  return {
    '--bg': bg,
    '--surface': bg,
    '--surface-2': mix(bg, ink, 0.06),
    '--border': mix(bg, ink, 0.14),
    '--border-strong': mix(bg, ink, 0.28),
    '--text': ink,
    '--text-2': mix(ink, bg, 0.32),
    '--text-3': mix(ink, bg, 0.52),
  };
}
