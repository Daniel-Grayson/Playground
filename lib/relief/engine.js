import { deviceRatio } from '../dpr';

import {
  GRID_ROWS, BLUR_FRAC, NOISE_AMP, NOISE_FRAC,
  NLEV, KEY_INDEX, STEP, KEY, LEV0, levelAt,
  BAND, L_MIN, L_MAX, CYCLE_SEC, SWEEP_TABLE, SCENES, sample,
} from './params';

const FONT =
  "'PP Mori', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/* ---------- deterministic value noise ---------- */

function hash2(x, y, seed) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function vnoise(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  const top = a + (b - a) * u;
  const bot = c + (d - c) * u;
  return top + (bot - top) * v;
}

function fbm(x, y, seed) {
  let s = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < 5; i++) {
    s += amp * vnoise(x * f, y * f, seed + i * 101);
    f *= 2;
    amp *= 0.5;
  }
  return s;
}

/* ---------- separable box blur, three passes ≈ gaussian ---------- */

function boxBlur(src, w, h, r) {
  if (r < 1) return src;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const inv = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let j = -r; j <= r; j++) acc += src[row + Math.min(w - 1, Math.max(0, j))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc * inv;
      acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let j = -r; j <= r; j++) acc += tmp[Math.min(h - 1, Math.max(0, j)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc * inv;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

export class ReliefContour {
  ok = false;

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ok = true;

    this.raf = 0;
    this.running = false;
    this.elapsed = 0;
    this.base = 0;
    this.sceneIdx = 0;
    this.built = [];
    this.scrub = 0;       // pointer influence, 0..1
    this.scrubTo = 0;
    this.scrubP = 0.5;
    this.lastWall = 0;

    this.measure();
  }

  measure() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = deviceRatio();
    this.cw = Math.max(1, Math.round(rect.width));
    this.ch = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.cw * this.dpr);
    this.canvas.height = Math.round(this.ch * this.dpr);
    this.grid = this.ch / GRID_ROWS;                 // CSS px per field sample
    this.gw = Math.max(8, Math.ceil(this.cw / this.grid) + 1);
    this.gh = Math.max(8, GRID_ROWS + 1);
    this.built = [];                       // geometry is resolution-bound
  }

  /* ---------- field ---------- */

  field(scene) {
    const { gw, gh } = this;

    // Word mask, rasterised straight at grid resolution.
    const c = document.createElement('canvas');
    c.width = gw;
    c.height = gh;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#000';
    x.fillRect(0, 0, gw, gh);
    x.fillStyle = '#fff';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    // Fit the word to about two thirds of the card so terrain has room.
    let size = gh * 0.9;
    for (let i = 0; i < 20; i++) {
      x.font = `700 ${size}px ${FONT}`;
      if (x.measureText(scene.word).width <= gw * 0.66) break;
      size *= 0.92;
    }
    x.font = `700 ${size}px ${FONT}`;
    x.fillText(scene.word, gw / 2, gh / 2);

    const px = x.getImageData(0, 0, gw, gh).data;
    const m = new Float32Array(gw * gh);
    for (let i = 0; i < gw * gh; i++) m[i] = px[i * 4] / 255;

    // Blur radius in grid cells, three box passes. Constant by construction,
    // because the grid has a fixed row count.
    const r = Math.max(1, Math.round(BLUR_FRAC * GRID_ROWS * 0.6));
    let b = m;
    for (let i = 0; i < 3; i++) b = boxBlur(b, gw, gh, r);

    const h = new Float32Array(gw * gh);
    const ns = NOISE_FRAC * GRID_ROWS;
    for (let y = 0; y < gh; y++) {
      for (let i = y * gw, xg = 0; xg < gw; xg++, i++) {
        const bv = b[i];
        // Two gates, one per side, with a dead band across the key crossing.
        // Both ramps sit outside it, so b = 0.5 stays the only solution of
        // h = KEY and the word's contour is an exact letterform.
        let lo = (0.30 - bv) / 0.30;
        let hi = (bv - 0.76) / 0.20;
        lo = lo < 0 ? 0 : lo > 1 ? 1 : lo;
        hi = hi < 0 ? 0 : hi > 1 ? 1 : hi;
        const u = lo * lo * (3 - 2 * lo) + hi * hi * (3 - 2 * hi);
        h[i] = bv * 0.86 + fbm(xg / ns, y / ns, scene.seed) * NOISE_AMP * u;
      }
    }
    return h;
  }

  /* ---------- contours: one pass over cells, not one pass per level ---------- */

  contours(h) {
    const { gw, gh } = this;
    const segs = [];
    for (let i = 0; i < NLEV; i++) segs.push([]);

    for (let y = 0; y < gh - 1; y++) {
      for (let x = 0; x < gw - 1; x++) {
        const i0 = y * gw + x;
        const a = h[i0];
        const b = h[i0 + 1];
        const c = h[i0 + gw + 1];
        const d = h[i0 + gw];
        const lo = Math.min(a, b, c, d);
        const hi = Math.max(a, b, c, d);
        // Only the levels this cell actually spans — usually one or two, which
        // is what turns 32 full sweeps of the grid into a single one.
        let k0 = Math.ceil((lo - LEV0) / STEP);
        let k1 = Math.floor((hi - LEV0) / STEP);
        if (k0 < 0) k0 = 0;
        if (k1 > NLEV - 1) k1 = NLEV - 1;

        for (let k = k0; k <= k1; k++) {
          const L = LEV0 + k * STEP;
          let idx = 0;
          if (a > L) idx |= 8;
          if (b > L) idx |= 4;
          if (c > L) idx |= 2;
          if (d > L) idx |= 1;
          if (idx === 0 || idx === 15) continue;

          const T = (p, q) => (q === p ? 0.5 : (L - p) / (q - p));
          const tx = x + T(a, b);
          const rx = x + 1;
          const ry = y + T(b, c);
          const bx = x + T(d, c);
          const ly = y + T(a, d);
          const s = segs[k];
          const put = (x0, y0, x1, y1) => s.push(x0, y0, x1, y1);

          switch (idx) {
            case 1: case 14: put(x, ly, bx, y + 1); break;
            case 2: case 13: put(bx, y + 1, rx, ry); break;
            case 3: case 12: put(x, ly, rx, ry); break;
            case 4: case 11: put(tx, y, rx, ry); break;
            case 5: put(x, ly, tx, y); put(bx, y + 1, rx, ry); break;
            case 6: case 9: put(tx, y, bx, y + 1); break;
            case 7: case 8: put(x, ly, tx, y); break;
            case 10: put(x, ly, bx, y + 1); put(tx, y, rx, ry); break;
            default: break;
          }
        }
      }
    }

    return segs.map((s) => {
      const p = new Path2D();
      for (let i = 0; i < s.length; i += 4) {
        p.moveTo(s[i], s[i + 1]);
        p.lineTo(s[i + 2], s[i + 3]);
      }
      return p;
    });
  }

  /* ---------- the map is printed once ---------- */

  build(idx) {
    if (this.built[idx]) return this.built[idx];
    const scene = SCENES[idx];
    const paths = this.contours(this.field(scene));

    const map = document.createElement('canvas');
    map.width = this.canvas.width;
    map.height = this.canvas.height;
    const g = map.getContext('2d');
    g.fillStyle = scene.bg;
    g.fillRect(0, 0, map.width, map.height);

    const s = this.grid * this.dpr;
    g.setTransform(s, 0, 0, s, 0, 0);
    g.strokeStyle = scene.line;
    g.lineCap = 'round';
    for (let i = 0; i < NLEV; i++) {
      // High ground is drawn a touch heavier, the way a survey sheet indexes
      // every fifth contour — it gives the stack depth without any shading.
      g.globalAlpha = 0.30 + 0.14 * (i / (NLEV - 1)) + (i % 5 === 0 ? 0.1 : 0);
      g.lineWidth = ((i % 5 === 0 ? 1.5 : 1.05) * this.dpr) / s;
      g.stroke(paths[i]);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;

    this.built[idx] = { scene, paths, map };
    return this.built[idx];
  }

  /* ---------- frame ---------- */

  drawAt(t) {
    const ctx = this.ctx;
    if (!ctx) return;

    const u = (t % CYCLE_SEC) / CYCLE_SEC;
    const idx = Math.floor(t / CYCLE_SEC) % SCENES.length;
    const b = this.build(idx);

    // Pointer scrubs the elevation. It blends with the automatic sweep rather
    // than replacing it, so letting go never snaps.
    const auto = sample(SWEEP_TABLE, u);
    const p = auto + (this.scrubP - auto) * this.scrub;
    const L = L_MIN + p * (L_MAX - L_MIN);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(b.map, 0, 0);

    const s = this.grid * this.dpr;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const reach = BAND * STEP;
    for (let i = 0; i < NLEV; i++) {
      const dist = Math.abs(levelAt(i) - L) / reach;
      if (dist >= 1) continue;
      const w = 1 - dist;
      const isKey = i === KEY_INDEX;
      // The key contour is the only line that ever takes the accent, so the
      // word arrives as a colour as well as a brightness.
      ctx.strokeStyle = isKey ? b.scene.key : b.scene.line;
      ctx.globalAlpha = isKey ? Math.pow(w, 0.7) : 0.25 + 0.5 * w * w;
      ctx.lineWidth = (((isKey ? 1.6 : 1.1) + (isKey ? 3.2 : 1.6) * w) * this.dpr) / s;
      ctx.stroke(b.paths[i]);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
  }

  /* ---------- pointer ---------- */

  setPointer(xCss, yCss) {
    this.scrubTo = 1;
    // Up the card is up the mountain.
    this.scrubP = Math.min(1, Math.max(0, 1 - yCss / Math.max(1, this.ch)));
  }

  clearPointer() {
    this.scrubTo = 0;
  }

  /* ---------- loop ---------- */

  now() {
    return this.running ? performance.now() / 1000 - this.base : this.elapsed;
  }

  tick = () => {
    if (!this.running) return;
    const wall = performance.now() / 1000;
    const dt = this.lastWall ? Math.min(0.1, wall - this.lastWall) : 0;
    this.lastWall = wall;
    this.scrub += (this.scrubTo - this.scrub) * (1 - Math.exp(-dt / 0.16));
    this.drawAt(this.now());
    this.raf = requestAnimationFrame(this.tick);
  };

  start() {
    if (!this.ok || this.running) return;
    this.running = true;
    this.base = performance.now() / 1000 - this.elapsed;
    this.lastWall = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    if (!this.running) return;
    this.elapsed = this.now();
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resize() {
    if (!this.ok) return;
    this.measure();
    this.drawAt(this.now());
  }

  renderStill() {
    if (!this.ok) return;
    // Parked on the hold, where the word is readable.
    this.elapsed = CYCLE_SEC * 0.52;
    this.drawAt(this.elapsed);
  }

  destroy() {
    this.stop();
    this.built = [];
    this.ctx = null;
    this.ok = false;
  }
}
