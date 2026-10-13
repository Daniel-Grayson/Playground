// A procedural scene used as the input texture for the shader effects.
// Keeping the source generated rather than an image file means the repo has
// no binary assets and every shader demo still has something moving to chew on.

export function createScene(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(w));
  c.height = Math.max(2, Math.round(h));
  return { canvas: c, ctx: c.getContext('2d', { alpha: false }) };
}

export function drawScene(scene, t, { text = 'VAULT', pointer } = {}) {
  const { canvas: c, ctx } = scene;
  const { width: w, height: h } = c;

  ctx.fillStyle = '#05050a';
  ctx.fillRect(0, 0, w, h);

  // Three drifting light sources. Additive so overlaps blow out to white,
  // which gives the downstream shaders a full tonal range to work with.
  ctx.globalCompositeOperation = 'lighter';
  const blobs = [
    { hue: [255, 120, 60], px: 0.32, py: 0.38, r: 0.55, sx: 0.31, sy: 0.23 },
    { hue: [70, 140, 255], px: 0.68, py: 0.56, r: 0.5, sx: -0.24, sy: 0.33 },
    { hue: [180, 255, 170], px: 0.5, py: 0.72, r: 0.42, sx: 0.19, sy: -0.28 },
  ];
  for (const b of blobs) {
    const x = (b.px + Math.sin(t * b.sx) * 0.16) * w;
    const y = (b.py + Math.cos(t * b.sy) * 0.16) * h;
    const r = b.r * Math.min(w, h);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${b.hue[0]},${b.hue[1]},${b.hue[2]},0.72)`);
    g.addColorStop(0.45, `rgba(${b.hue[0]},${b.hue[1]},${b.hue[2]},0.2)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // A highlight that tracks the pointer, so the shaders feel interactive
  // even when the effect itself does not read the pointer.
  if (pointer?.inside) {
    const r = Math.min(w, h) * 0.3;
    const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = 'source-over';

  if (text) {
    const size = Math.min(w / (text.length * 0.62), h * 0.42);
    ctx.font = `800 ${size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.1);
    ctx.strokeText(text, w / 2, h / 2);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, h / 2);
  }

  return c;
}

/** Resolution the scene is rendered at: capped, since shaders resample it anyway. */
export function sceneSize(w, h) {
  const maxW = 900;
  const s = Math.min(1, maxW / Math.max(1, w));
  return { w: Math.max(2, Math.round(w * s)), h: Math.max(2, Math.round(h * s)) };
}
