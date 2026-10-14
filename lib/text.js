// Render text to an offscreen canvas and read it back as data.
// Several effects work by treating a word as a bitmap rather than as glyphs:
// sample it, then move the samples around.

/** Draw text into an offscreen canvas sized to fit, returning the canvas. */
export function renderText(text, {
  width,
  height,
  fontFamily = "'PP Mori', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  weight = 700,
  fontSize,
  color = '#fff',
  background = null,
  letterSpacing = 0,
  padding = 0.08,
} = {}) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(width));
  c.height = Math.max(1, Math.round(height));
  const ctx = c.getContext('2d', { willReadFrequently: true });

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, c.width, c.height);
  }

  // Binary-search a size that fits the box, unless one was given.
  let size = fontSize;
  if (!size) {
    let lo = 4;
    let hi = c.height * 2;
    const maxW = c.width * (1 - padding * 2);
    const maxH = c.height * (1 - padding * 2);
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      ctx.font = `${weight} ${mid}px ${fontFamily}`;
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${letterSpacing * mid}px`;
      const m = ctx.measureText(text);
      const wFits = m.width <= maxW;
      const ascent = m.actualBoundingBoxAscent || mid * 0.72;
      const descent = m.actualBoundingBoxDescent || mid * 0.2;
      const hFits = ascent + descent <= maxH;
      if (wFits && hFits) lo = mid;
      else hi = mid;
    }
    size = lo;
  }

  ctx.font = `${weight} ${size}px ${fontFamily}`;
  if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${letterSpacing * size}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, c.width / 2, c.height / 2);

  return c;
}

/**
 * Sample rendered text into a sparse list of points on `step`-pixel centres,
 * keeping only the ones that landed on ink. This is how type becomes particles.
 */
export function sampleText(text, { width, height, step = 6, threshold = 128, ...textOpts }) {
  const c = renderText(text, { width, height, ...textOpts });
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  const points = [];
  for (let y = step / 2; y < c.height; y += step) {
    for (let x = step / 2; x < c.width; x += step) {
      const i = ((y | 0) * c.width + (x | 0)) * 4;
      if (data[i + 3] > threshold) points.push({ x, y });
    }
  }
  return { points, canvas: c };
}

/** Per-character layout boxes, for effects that move whole letters. */
export function measureChars(ctx, text, font) {
  ctx.save();
  ctx.font = font;
  ctx.textBaseline = 'alphabetic';
  const total = ctx.measureText(text).width;
  const boxes = [];
  let x = 0;
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    boxes.push({ ch, x, w });
    x += w;
  }
  ctx.restore();
  return { boxes, total };
}
