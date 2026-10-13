/** Read a CSS custom property off an element, so canvases follow the theme. */
export function cssVar(el, name, fallback = '#000') {
  if (typeof window === 'undefined' || !el) return fallback;
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

/** Parse #rgb / #rrggbb into [r, g, b] 0..1, for shader uniforms. */
export function hexToRgb(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
