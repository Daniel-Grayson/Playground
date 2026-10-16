import {
  PANEL, INK, DIM, REACH, DAMP_HALF,
  MARK_LEFT, MARK_TOP, MARK_H, MARK_GAP, LABEL_GAP, CAP, MARK_PAD,
  LABELS, FONT_STACK, FONT_WEIGHT, HORSE, PRANCE_FPS, idleAt,
} from './params';
import { clamp, lerp } from '../math';

const ROWS = HORSE[0].length;
const COLS = HORSE[0][0].length;

function mix(a, b, t) {
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r},${g},${bl})`;
}

const rgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

export class LampNav {
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

    this.pointer = null;    // CSS px, or null
    this.lamp = null;       // CSS px; the one damped piece of state

    this.phase = 0;         // stride phase, in frames
    this.striding = false;

    this.panel = rgb(PANEL);
    this.ink = rgb(INK);

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
    this.layout();
  }

  /** Everything in CSS px, every length derived from card height. */
  layout() {
    const ctx = this.ctx;
    const h = this.ch;
    const PROBE = 100;
    ctx.font = `${FONT_WEIGHT} ${PROBE}px ${FONT_STACK}`;
    const capProbe = ctx.measureText('H').actualBoundingBoxAscent || PROBE * 0.72;

    // Lengths come from card height, but the lockup has to fit the card's
    // WIDTH or the last label runs off the edge. Measure the natural width
    // once and take the whole bar down by one factor if it does not fit, so
    // the proportions survive and only the size gives.
    const natural = (k) => {
      const px = Math.max(1, Math.round((MARK_H * h * k / ROWS) * this.dpr) / this.dpr);
      const fontPx = (CAP * h * k * PROBE) / capProbe;
      ctx.font = `${FONT_WEIGHT} ${fontPx}px ${FONT_STACK}`;
      let w = px * COLS + MARK_GAP * h * k;
      LABELS.forEach((word, i) => {
        w += ctx.measureText(word).width + (i < LABELS.length - 1 ? LABEL_GAP * h * k : 0);
      });
      return { px, fontPx, w };
    };

    const avail = this.cw - 2 * MARK_LEFT * h;
    let fit = natural(1);
    if (fit.w > avail) fit = natural(Math.max(0.3, avail / fit.w));
    const k = fit.fontPx / ((CAP * h * PROBE) / capProbe);

    // Snapped to the device pixel grid: a bitmap drawn on fractional
    // coordinates antialiases every cell edge and the mark comes out as a
    // lattice of seams rather than as blocks.
    const snap = (v) => Math.round(v * this.dpr) / this.dpr;
    this.px = fit.px;
    this.markX = snap(MARK_LEFT * h);
    this.markY = snap(MARK_TOP * h);
    this.markW = fit.px * COLS;
    this.markHpx = fit.px * ROWS;

    this.fontPx = fit.fontPx;
    ctx.font = `${FONT_WEIGHT} ${this.fontPx}px ${FONT_STACK}`;

    const mid = this.markY + this.markHpx / 2;
    let pen = this.markX + this.markW + MARK_GAP * h * k;
    this.glyphs = [];
    for (const word of LABELS) {
      for (const ch of word) {
        const w = ctx.measureText(ch).width;
        this.glyphs.push({ ch, x: pen, cx: pen + w / 2, cy: mid, baseline: mid + CAP * h * k / 2 });
        pen += w;
      }
      pen += LABEL_GAP * h * k;
    }
  }

  setPointer(x, y) { this.pointer = { x, y }; }
  clearPointer() { this.pointer = null; }

  /** Is p over the mark, with a little slack? */
  overMark(p) {
    if (!p) return false;
    const pad = MARK_PAD * this.ch;
    return p.x >= this.markX - pad && p.x <= this.markX + this.markW + pad
      && p.y >= this.markY - pad && p.y <= this.markY + this.markHpx + pad;
  }

  /** The field. One function, read by every mark at its own position. */
  bright(x, y) {
    const r = REACH * this.ch;
    const dx = x - this.lamp.x;
    const dy = y - this.lamp.y;
    const d2 = (dx * dx + dy * dy) / (r * r);
    return DIM + (1 - DIM) / (1 + d2);
  }

  step(dt) {
    this.simT += dt;

    // The lamp: damped toward the pointer, or toward the travelling path.
    const idle = idleAt(this.simT);
    const target = this.pointer ?? { x: idle.x * this.cw, y: idle.y * this.ch };
    if (!this.lamp) this.lamp = { ...target };
    const k = 1 - Math.pow(0.5, dt / DAMP_HALF);
    this.lamp.x += (target.x - this.lamp.x) * k;
    this.lamp.y += (target.y - this.lamp.y) * k;

    // The stride. Starting is immediate; stopping waits for the frame where
    // all four feet are down, which is frame 0 — the cycle's own rest pose.
    const over = this.overMark(this.pointer);
    if (over) this.striding = true;
    if (this.striding) {
      const next = this.phase + dt * PRANCE_FPS;
      if (!over && Math.floor(next / HORSE.length) > Math.floor(this.phase / HORSE.length)) {
        this.phase = 0;
        this.striding = false;
      } else {
        this.phase = next % (HORSE.length * 64);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx || !this.lamp) return;
    const s = this.dpr;

    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fillStyle = PANEL;
    ctx.fillRect(0, 0, this.cw, this.ch);

    const frame = HORSE[Math.floor(this.phase) % HORSE.length];
    const px = this.px;
    for (let r = 0; r < ROWS; r++) {
      const row = frame[r];
      const y = this.markY + r * px;
      let c = 0;
      while (c < COLS) {
        if (row[c] !== '#') { c++; continue; }
        // Run of lit pixels: each samples the field at its own centre, so a
        // run is still a gradient, but one fillRect per constant-ish cell.
        const x = this.markX + c * px;
        ctx.fillStyle = mix(this.panel, this.ink, clamp(this.bright(x + px / 2, y + px / 2)));
        ctx.fillRect(x, y, px, px);
        c++;
      }
    }

    ctx.font = `${FONT_WEIGHT} ${this.fontPx}px ${FONT_STACK}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    for (const g of this.glyphs) {
      ctx.fillStyle = mix(this.panel, this.ink, clamp(this.bright(g.cx, g.cy)));
      ctx.fillText(g.ch, g.x, g.baseline);
    }
  }

  loop = (now) => {
    if (!this.running) return;
    // Clamped: the first rAF timestamp can predate start()'s own clock, and
    // a tab-resume hands back a delta of minutes.
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
    this.lamp = null;       // re-seeded on the next step, in the new space
    this.step(0);
    this.draw();
  }

  /** Reduced motion: the lamp parked over the first label, horse standing. */
  renderStill() {
    this.lamp = { x: this.glyphs[1]?.cx ?? this.cw / 2, y: this.markY + this.markHpx / 2 };
    this.phase = 0;
    this.draw();
  }

  destroy() {
    this.stop();
    this.ok = false;
  }
}
