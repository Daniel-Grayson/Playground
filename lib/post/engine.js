import {
  PAPER, STAMPS, SIZE, STAMP_PAPER,
  PERF_MARGIN, PERF_STEP, PERF_R, FRAME_GAP, TOP_BAND, BOTTOM_BAND,
  LINES, MIN_PERIOD,
  LIFT_UP, LIFT_DOWN, LIFT_SCALE, LIFT_SQUARE, LIFT_LEAN,
  IDLE_EVERY, IDLE_HOLD, IDLE_ORDER, SERIF,
} from './params';
import { drawScene } from './scenes';
import { clamp, rng } from '../math';

const rgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
const DEG = Math.PI / 180;

/** Cut a tone map into line engraving: one ink, one paper, nothing between
 *  but how wide each line is. */
function engrave(tone, w, h, ink, paper) {
  const src = tone.getImageData(0, 0, w, h).data;
  const d = new Float32Array(w * h);
  for (let i = 0; i < d.length; i++) d[i] = 1 - src[i * 4] / 255;

  const P = Math.max(MIN_PERIOD, h / LINES);
  const out = tone.createImageData(w, h);
  const o = out.data;
  const A = rgb(ink);
  const B = rgb(paper);
  const grain = rng(11);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const t = d[i];
      // The main screen: horizontal lines with a slow wave in them, the
      // burin's hand. Half-width is the tone, so tone 1 closes the lines up.
      const u = (y + 0.3 * P * Math.sin(x / (P * 4.5) + y / (P * 9))) / P;
      const dist = Math.abs(u - Math.floor(u) - 0.5) * P;
      let cov = clamp(0.5 * P * t - dist + 0.5);
      // The cross screen, only in the shadows.
      if (t > 0.5) {
        const v = (x + y) / (P * 1.25);
        const dv = Math.abs(v - Math.floor(v) - 0.5) * P * 1.25;
        cov = Math.max(cov, clamp(0.55 * P * (t - 0.5) - dv + 0.5));
      }
      // The contour: wherever the tone steps, the engraver drew the edge.
      if (x > 0 && y > 0 && x < w - 1 && y < h - 1) {
        const g = Math.abs(d[i + 1] - d[i - 1]) + Math.abs(d[i + w] - d[i - w]);
        if (g > 0.16) cov = Math.max(cov, clamp((g - 0.16) * 3));
      }
      // A little unevenness in the take-up of the ink.
      cov *= 0.88 + 0.12 * grain();
      const k = i * 4;
      o[k] = B[0] + (A[0] - B[0]) * cov;
      o[k + 1] = B[1] + (A[1] - B[1]) * cov;
      o[k + 2] = B[2] + (A[2] - B[2]) * cov;
      o[k + 3] = 255;
    }
  }
  return out;
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
  }

  measure() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = Math.max(1, Math.round(rect.width));
    this.ch = Math.max(1, Math.round(rect.height));
    this.W = Math.round(this.cw * this.dpr);
    this.H = Math.round(this.ch * this.dpr);
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.paintSheet();
    for (const s of this.stamps) this.cut(s);
  }

  /** The album sheet: flat cream with a fine grain and a few fibres. */
  paintSheet() {
    const c = document.createElement('canvas');
    c.width = this.W;
    c.height = this.H;
    const x = c.getContext('2d');
    x.fillStyle = PAPER;
    x.fillRect(0, 0, this.W, this.H);
    const img = x.getImageData(0, 0, this.W, this.H);
    const r = rng(5);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (r() - 0.5) * 7;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    x.putImageData(img, 0, 0);
    x.strokeStyle = 'rgba(120,100,70,0.035)';
    x.lineWidth = this.dpr * 0.6;
    for (let i = 0; i < 70; i++) {
      const fx = r() * this.W;
      const fy = r() * this.H;
      const a = r() * Math.PI;
      const l = (4 + r() * 14) * this.dpr;
      x.beginPath();
      x.moveTo(fx, fy);
      x.quadraticCurveTo(fx + Math.cos(a) * l * 0.5 + r() * 3, fy + Math.sin(a) * l * 0.5 + r() * 3, fx + Math.cos(a) * l, fy + Math.sin(a) * l);
      x.stroke();
    }
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
    drawScene(s.key, tx, dw, dh);
    tx.putImageData(engrave(tx, dw, dh, s.ink, STAMP_PAPER), 0, 0);
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

  setPointer(x, y) { this.pointer = { x, y }; }
  clearPointer() { this.pointer = null; }

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
    if (this.held && this.contains(this.held, p)) return this.held;
    for (let i = this.order.length - 1; i >= 0; i--) {
      if (this.contains(this.order[i], p)) return this.order[i];
    }
    return null;
  }

  idlePick() {
    const n = Math.floor(this.simT / IDLE_EVERY);
    if (this.simT - n * IDLE_EVERY > IDLE_HOLD) return null;
    const key = IDLE_ORDER[n % IDLE_ORDER.length];
    return this.stamps.find((s) => s.key === key) ?? null;
  }

  step(dt) {
    this.simT += dt;
    const target = this.pointer ? this.pick(this.pointer) : this.idlePick();
    if (target !== this.held) {
      this.held = target;
      // Picking a stamp up puts it on top, and it stays there.
      if (target) {
        this.order = this.order.filter((s) => s !== target);
        this.order.push(target);
      }
    }
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
      // Held at the pointer: it leans toward where the finger is.
      if (L > 0 && this.pointer && s === this.held) {
        x += (this.pointer.x - r.x) * LIFT_LEAN * L;
        y += (this.pointer.y - r.y) * LIFT_LEAN * L;
      }
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
