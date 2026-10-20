import {
  PAPER, SHEET, STAMPS, SIZE, STAMP_PAPER,
  PERF_MARGIN, PERF_STEP, PERF_R, FRAME_GAP, TOP_BAND, BOTTOM_BAND,
  GRADE,
  LIFT_UP, LIFT_DOWN, LIFT_SCALE, LIFT_SQUARE,
  SERIF,
} from './params';
import { clamp, rng } from '../math';
import { deviceRatio } from '../dpr';

const rgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
const DEG = Math.PI / 180;

/** The colour grade: the photograph's own light, re-inked. Levels are set
 *  from the picture's own 2nd and 98th percentiles so a hazy shot and a hard
 *  one land on the same range, a gentle S-curve gives it print contrast, and
 *  then luminance alone picks the colour along one ramp — the ink's deep
 *  shade in the shadows, the ink itself in the mids, the stamp's paper in
 *  the highlights. The picture keeps all of its light and none of its hue,
 *  which is what holds every stamp to two colours. */
function grade(c, w, h, ink, paper) {
  const img = c.getImageData(0, 0, w, h);
  const d = img.data;
  const n = w * h;
  const L = new Float32Array(n);
  const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) {
    const k = i * 4;
    const l = 0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2];
    L[i] = l;
    hist[Math.min(255, l | 0)]++;
  }
  const at = (q) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= q * n) return v; }
    return 255;
  };
  const lo = at(GRADE.low);
  const hi = Math.max(lo + 1, at(GRADE.high));
  const A = rgb(ink);
  const P = rgb(paper);
  const S = A.map((v) => v * GRADE.shade);
  const grain = rng(17);
  const mid = GRADE.mid;
  for (let i = 0; i < n; i++) {
    let t = clamp((L[i] - lo) / (hi - lo));
    t += (t * t * (3 - 2 * t) - t) * GRADE.contrast;
    t = clamp(t + (grain() - 0.5) * GRADE.grain);
    const k = i * 4;
    if (t < mid) {
      const u = t / mid;
      d[k] = S[0] + (A[0] - S[0]) * u;
      d[k + 1] = S[1] + (A[1] - S[1]) * u;
      d[k + 2] = S[2] + (A[2] - S[2]) * u;
    } else {
      const u = (t - mid) / (1 - mid);
      d[k] = A[0] + (P[0] - A[0]) * u;
      d[k + 1] = A[1] + (P[1] - A[1]) * u;
      d[k + 2] = A[2] + (P[2] - A[2]) * u;
    }
  }
  c.putImageData(img, 0, 0);
}

function fitText(ctx, text, px, maxW, weight, spacing) {
  let size = px;
  for (let i = 0; i < 8; i++) {
    ctx.font = `${weight} ${size}px ${SERIF}`;
    const w = ctx.measureText(text).width + spacing * size * (text.length - 1);
    if (w <= maxW) break;
    size *= maxW / w;
  }
  return size;
}

function spaced(ctx, text, x, y, size, spacing, align) {
  const gap = spacing * size;
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
  let pen = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.textAlign = 'left';
  chars.forEach((ch, i) => {
    ctx.fillText(ch, pen, y);
    pen += widths[i] + gap;
  });
}

export class PostCities {
  ok = false;

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ok = true;

    this.raf = 0;
    this.running = false;
    this.simT = 0;
    this.last = 0;
    this.pointer = null;
    this.held = null;          // the stamp the pointer is holding

    this.stamps = STAMPS.map((s) => ({ ...s, lift: 0, img: null }));
    this.order = this.stamps.slice();   // paint order; the end is the top

    this.measure();

    // The photographs arrive when they arrive; each stamp is re-cut as its
    // own comes in, and until then shows bare paper in its window.
    for (const st of this.stamps) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (!this.ok) return;
        st.img0 = img;
        this.cut(st);
        this.draw();
      };
      img.src = st.photo;
    }
  }

  measure() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = deviceRatio();
    this.cw = Math.max(1, Math.round(rect.width));
    this.ch = Math.max(1, Math.round(rect.height));
    this.W = Math.round(this.cw * this.dpr);
    this.H = Math.round(this.ch * this.dpr);
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.paintSheet();
    for (const s of this.stamps) this.cut(s);
  }

  /** The album sheet: rough, cold-pressed paper. The surface is a height
   *  field — value noise at a few scales, from the cloudy unevenness of the
   *  pulp down to the tooth, plus pressed-in fibres — and it is lit once from
   *  the top left, so every bump shows as a lit side and a shaded side
   *  rather than as speckle. Paper reads as rough because of that relief, not
   *  because of grey dots; and a little of the height also tints the tone,
   *  which is the blotchiness of real pulp. Painted once per resize. */
  paintSheet() {
    const { W, H, dpr } = this;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    const hgt = new Float32Array(W * H);

    // Value noise on a lattice, smoothly interpolated, one octave at a time.
    const r = rng(5);
    const octave = (cell, amp) => {
      const cs = cell * dpr;
      const gw = Math.ceil(W / cs) + 2;
      const gh = Math.ceil(H / cs) + 2;
      const g = new Float32Array(gw * gh);
      for (let i = 0; i < g.length; i++) g[i] = r() * 2 - 1;
      for (let y = 0; y < H; y++) {
        const fy = y / cs;
        const iy = fy | 0;
        let ty = fy - iy;
        ty = ty * ty * (3 - 2 * ty);
        for (let xx = 0; xx < W; xx++) {
          const fx = xx / cs;
          const ix = fx | 0;
          let tx = fx - ix;
          tx = tx * tx * (3 - 2 * tx);
          const o = iy * gw + ix;
          const a0 = g[o] + (g[o + 1] - g[o]) * tx;
          const a1 = g[o + gw] + (g[o + gw + 1] - g[o + gw]) * tx;
          hgt[y * W + xx] += (a0 + (a1 - a0) * ty) * amp;
        }
      }
    };
    for (const [cell, amp] of SHEET.octaves) octave(cell, amp);

    // The fine tooth: per-pixel, so it never scales into blobs.
    for (let i = 0; i < hgt.length; i++) hgt[i] += (r() - 0.5) * SHEET.tooth;

    // Fibres pressed into the surface: short wandering ridges.
    for (let f = 0; f < SHEET.fibres * (W * H) / 1e6; f++) {
      let fx = r() * W;
      let fy = r() * H;
      let ang = r() * Math.PI * 2;
      const len = (6 + r() * 22) * dpr;
      const lift = (r() < 0.5 ? -1 : 1) * SHEET.fibreDepth * (0.5 + r());
      for (let t = 0; t < len; t += 0.7) {
        ang += (r() - 0.5) * 0.25;
        fx += Math.cos(ang) * 0.7;
        fy += Math.sin(ang) * 0.7;
        const ix = fx | 0;
        const iy = fy | 0;
        if (ix >= 0 && iy >= 0 && ix < W && iy < H) hgt[iy * W + ix] += lift;
      }
    }

    // Light it from the top left, and let the height tint the tone a little.
    const base = rgb(PAPER);
    const img = x.createImageData(W, H);
    const d = img.data;
    const step = Math.max(1, Math.round(dpr));
    for (let y = 0; y < H; y++) {
      for (let xx = 0; xx < W; xx++) {
        const i = y * W + xx;
        const a = hgt[Math.max(0, y - step) * W + Math.max(0, xx - step)];
        const b = hgt[Math.min(H - 1, y + step) * W + Math.min(W - 1, xx + step)];
        const v = (a - b) * SHEET.relief + hgt[i] * SHEET.mottle;
        const k = i * 4;
        d[k] = base[0] + v;
        d[k + 1] = base[1] + v;
        d[k + 2] = base[2] + v * 1.15;
        d[k + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    this.sheet = c;
  }

  /** One stamp, printed and perforated, at the size it is drawn when held so
   *  lifting it never blurs it. */
  cut(s) {
    const size = SIZE[s.shape];
    const sw = size.w * this.ch;
    const sh = size.h * this.ch;
    const k = this.dpr * (1 + LIFT_SCALE);
    const W = Math.ceil(sw * k);
    const H = Math.ceil(sh * k);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    x.scale(k, k);
    s.w = sw;
    s.h = sh;
    s.k = k;

    const u = Math.min(sw, sh);
    const pm = PERF_MARGIN * u;
    const fg = FRAME_GAP * u;
    const top = TOP_BAND * u;
    const bot = BOTTOM_BAND * u;

    // Paper, then the holes punched out of its edge.
    x.fillStyle = STAMP_PAPER;
    x.fillRect(0, 0, sw, sh);
    x.globalCompositeOperation = 'destination-out';
    const holes = (len, place) => {
      const n = Math.max(2, Math.round(len / (PERF_STEP * u)));
      for (let i = 0; i <= n; i++) {
        const [hx, hy] = place((i / n) * len);
        x.beginPath();
        x.arc(hx, hy, PERF_R * u, 0, Math.PI * 2);
        x.fill();
      }
    };
    holes(sw, (t) => [t, 0]);
    holes(sw, (t) => [t, sh]);
    holes(sh, (t) => [0, t]);
    holes(sh, (t) => [sw, t]);
    x.globalCompositeOperation = 'source-over';

    // The frame.
    x.strokeStyle = s.ink;
    x.lineWidth = Math.max(0.6, 0.012 * u);
    x.strokeRect(pm, pm, sw - 2 * pm, sh - 2 * pm);
    x.lineWidth = Math.max(0.4, 0.005 * u);
    x.strokeRect(pm + fg * 0.45, pm + fg * 0.45, sw - 2 * pm - fg * 0.9, sh - 2 * pm - fg * 0.9);

    // The picture.
    const px = pm + fg;
    const py = pm + fg + top;
    const pw = sw - 2 * (pm + fg);
    const ph = sh - 2 * (pm + fg) - top - bot;
    const dw = Math.max(2, Math.round(pw * this.dpr * (1 + LIFT_SCALE)));
    const dh = Math.max(2, Math.round(ph * this.dpr * (1 + LIFT_SCALE)));
    const tc = document.createElement('canvas');
    tc.width = dw;
    tc.height = dh;
    const tx = tc.getContext('2d', { willReadFrequently: true });
    const ph0 = s.img0;
    if (ph0) {
      // Cover-crop around the stamp's focus, so the landmark stays in frame
      // whatever the photograph's own proportions.
      const sc = Math.max(dw / ph0.naturalWidth, dh / ph0.naturalHeight);
      const vw = dw / sc;
      const vh = dh / sc;
      const [fx, fy] = s.focus ?? [0.5, 0.5];
      const sx = clamp(fx * ph0.naturalWidth - vw / 2, 0, ph0.naturalWidth - vw);
      const sy = clamp(fy * ph0.naturalHeight - vh / 2, 0, ph0.naturalHeight - vh);
      tx.drawImage(ph0, sx, sy, vw, vh, 0, 0, dw, dh);
      grade(tx, dw, dh, s.ink, STAMP_PAPER);
    } else {
      tx.fillStyle = STAMP_PAPER;
      tx.fillRect(0, 0, dw, dh);
    }
    x.drawImage(tc, px, py, pw, ph);
    x.lineWidth = Math.max(0.6, 0.01 * u);
    x.strokeRect(px, py, pw, ph);

    // The lettering: the city across the top, country and value below.
    x.fillStyle = s.ink;
    x.textBaseline = 'alphabetic';
    let fs = fitText(x, s.city, 0.085 * u, pw * 0.92, 700, 0.14);
    x.font = `700 ${fs}px ${SERIF}`;
    spaced(x, s.city, sw / 2, pm + fg + top * 0.5 + fs * 0.36, fs, 0.14, 'center');

    const by = sh - pm - fg - bot * 0.5;
    fs = fitText(x, s.country, 0.05 * u, pw * 0.55, 600, 0.16);
    x.font = `600 ${fs}px ${SERIF}`;
    spaced(x, s.country, px, by + fs * 0.36, fs, 0.16, 'left');
    fs = 0.08 * u;
    x.font = `700 ${fs}px ${SERIF}`;
    spaced(x, s.value, px + pw, by + fs * 0.36, fs, 0.04, 'right');

    s.img = c;
  }

  setPointer(x, y) {
    this.pointer = { x, y };
    // A held stamp goes wherever the pointer takes it, anywhere in the frame.
    const s = this.held;
    if (s && this.grab) {
      s.x = clamp((x - this.grab.x) / this.cw);
      s.y = clamp((y - this.grab.y) / this.ch);
    }
  }
  clearPointer() { this.pointer = null; }

  /** Pick up the topmost stamp under the pointer, keeping the point it was
   *  taken by, so it does not jump to centre itself on the pointer. */
  press(x, y) {
    this.pointer = { x, y };
    const s = this.pick(this.pointer);
    if (!s) return false;
    this.held = s;
    this.grab = { x: x - s.x * this.cw, y: y - s.y * this.ch };
    this.order = this.order.filter((o) => o !== s);
    this.order.push(s);     // on top, and it stays there once put down
    return true;
  }

  release() {
    this.held = null;
    this.grab = null;
  }

  /** What the cursor should be: an open hand over a stamp, a closed one
   *  while holding. */
  cursor(x, y) {
    if (this.held) return 'grabbing';
    return this.pick({ x, y }) ? 'grab' : 'default';
  }

  /** Centre and tilt of a stamp at rest, in CSS px. */
  rest(s) {
    return { x: s.x * this.cw, y: s.y * this.ch, a: s.rot * DEG };
  }

  /** Is p inside stamp s, tilt and all? */
  contains(s, p) {
    const { x, y, a } = this.rest(s);
    const dx = p.x - x;
    const dy = p.y - y;
    const lx = dx * Math.cos(-a) - dy * Math.sin(-a);
    const ly = dx * Math.sin(-a) + dy * Math.cos(-a);
    return Math.abs(lx) <= s.w / 2 && Math.abs(ly) <= s.h / 2;
  }

  /** The stamp the pointer would pick up: the one held keeps hold while the
   *  pointer is still on it, otherwise the topmost under it. */
  pick(p) {
    if (!p) return null;
    for (let i = this.order.length - 1; i >= 0; i--) {
      if (this.contains(this.order[i], p)) return this.order[i];
    }
    return null;
  }

  step(dt) {
    this.simT += dt;
    for (const s of this.stamps) {
      const goal = s === this.held ? 1 : 0;
      const h = goal > s.lift ? LIFT_UP : LIFT_DOWN;
      s.lift += (goal - s.lift) * (1 - Math.pow(0.5, dt / h));
    }
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.sheet, 0, 0);

    const d = this.dpr;
    for (const s of this.order) {
      if (!s.img) continue;
      const r = this.rest(s);
      const L = s.lift;
      let x = r.x;
      let y = r.y;
      const a = r.a * (1 - LIFT_SQUARE * L);
      const sc = 1 + LIFT_SCALE * L;

      ctx.save();
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.translate(x, y - 2 * L);
      ctx.rotate(a);
      ctx.scale(sc / s.k, sc / s.k);
      // The shadow is the lift made visible: a stamp lying flat casts a
      // hairline, a held one a long soft one.
      ctx.shadowColor = `rgba(52,40,20,${0.16 + 0.14 * L})`;
      ctx.shadowBlur = (1.5 + 18 * L) * d;
      ctx.shadowOffsetX = (0.4 + 3 * L) * d;
      ctx.shadowOffsetY = (1 + 10 * L) * d;
      ctx.drawImage(s.img, -s.img.width / 2, -s.img.height / 2);
      ctx.restore();
    }
  }

  loop = (now) => {
    if (!this.running) return;
    const dt = Math.min(Math.max(0, (now - this.last) / 1000), 0.1);
    this.last = now;
    this.step(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resize() {
    this.measure();
    this.draw();
  }

  renderStill() {
    this.draw();
  }

  destroy() {
    this.stop();
    this.ok = false;
  }
}
