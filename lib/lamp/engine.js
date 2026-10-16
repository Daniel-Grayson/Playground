import {
  PAGE, PANEL, INK, DIM, REACH, DAMP_HALF,
  PANEL_LEFT, PANEL_TOP, PANEL_RADIUS,
  MARK_LEFT, MARK_TOP, MARK_H, MARK_GAP, LABEL_GAP, CAP, MARK_PAD,
  LABELS, FONT_STACK, FONT_WEIGHT,
  HORSE_PATH, HORSE_VIEW,
  LEGS, BODY, RUN_HZ, RUN_DEG, BOB, PIX_ROWS, PIX_MARGIN, idleAt,
} from './params';
import { clamp, lerp } from '../math';

const ASPECT = HORSE_VIEW.w / HORSE_VIEW.h;
// Stops across three reach-radii. The field is smooth, so a handful of
// samples of it reproduces the curve; past 3R it is flat within a percent.
const STOPS = [0, 0.08, 0.17, 0.28, 0.42, 0.6, 0.8, 1];

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

    this.phase = 0;         // stride phase, in cycles
    this.striding = false;
    this.path = typeof Path2D === 'function' ? new Path2D(HORSE_PATH) : null;
    // The pixel buffer. Its size depends only on the artwork, so it is made
    // once and never resized with the card.
    this.pixK = PIX_ROWS / HORSE_VIEW.h;
    this.buf = document.createElement('canvas');
    this.buf.width = Math.round((HORSE_VIEW.w + PIX_MARGIN.l + PIX_MARGIN.r) * this.pixK);
    this.buf.height = Math.round((HORSE_VIEW.h + PIX_MARGIN.t + PIX_MARGIN.b) * this.pixK);

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

    // The panel: inset from the top left, running off the right and bottom
    // edges, so only its top-left corner is ever drawn.
    this.panelX = PANEL_LEFT * this.cw;
    this.panelY = PANEL_TOP * h;
    this.radius = PANEL_RADIUS * h;

    const PROBE = 100;
    ctx.font = `${FONT_WEIGHT} ${PROBE}px ${FONT_STACK}`;
    const capProbe = ctx.measureText('H').actualBoundingBoxAscent || PROBE * 0.72;

    // Lengths come from card height, but the lockup has to fit the card's
    // WIDTH or the last label runs off the edge. Measure the natural width
    // once and take the whole bar down by one factor if it does not fit, so
    // the proportions survive and only the size gives.
    const natural = (k) => {
      const markH = MARK_H * h * k;
      const fontPx = (CAP * h * k * PROBE) / capProbe;
      ctx.font = `${FONT_WEIGHT} ${fontPx}px ${FONT_STACK}`;
      let w = markH * ASPECT + MARK_GAP * h * k;
      LABELS.forEach((word, i) => {
        w += ctx.measureText(word).width + (i < LABELS.length - 1 ? LABEL_GAP * h * k : 0);
      });
      return { markH, fontPx, w };
    };

    // Fit the bar to the PANEL, not the card: the page grey is not its room.
    const avail = this.cw - this.panelX - 2 * MARK_LEFT * h;
    let fit = natural(1);
    if (fit.w > avail) fit = natural(Math.max(0.3, avail / fit.w));
    const k = fit.fontPx / ((CAP * h * PROBE) / capProbe);

    // Snapped to the device pixel grid: a bitmap drawn on fractional
    // coordinates antialiases every cell edge and the mark comes out as a
    // lattice of seams rather than as blocks.
    const snap = (v) => Math.round(v * this.dpr) / this.dpr;
    this.markX = snap(this.panelX + MARK_LEFT * h * k);
    this.markY = snap(this.panelY + MARK_TOP * h * k);
    this.markHpx = fit.markH;
    this.markW = fit.markH * ASPECT;
    this.markScale = this.markHpx / HORSE_VIEW.h;

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
      const next = this.phase + dt * RUN_HZ;
      if (!over && Math.floor(next) > Math.floor(this.phase)) {
        this.phase = 0;            // landed: the cycle's own rest pose
        this.striding = false;
      } else {
        this.phase = next % 1024;
      }
    }
  }

  /** Paint one cut-out of the silhouette into `c`, at `k` target units per
   *  viewBox unit, lit from `lampVb` given in viewBox coordinates. */
  piece(c, k, rects, pvx, pvy, deg, lampVb, Rvb) {
    const a = (deg * Math.PI) / 180;
    // The lamp carried into this piece's own frame, so the light stays
    // continuous across the figure however each part is turned.
    const dx = lampVb.x - pvx;
    const dy = lampVb.y - pvy;
    const lx = pvx + dx * Math.cos(-a) - dy * Math.sin(-a);
    const ly = pvy + dx * Math.sin(-a) + dy * Math.cos(-a);

    c.save();
    c.scale(k, k);
    c.translate(pvx, pvy);
    c.rotate(a);
    c.translate(-pvx, -pvy);
    c.beginPath();
    for (const [x, y, w, h] of rects) c.rect(x, y, w, h);
    c.clip();
    const g = c.createRadialGradient(lx, ly, 0, lx, ly, Rvb * 3);
    for (const t of STOPS) {
      const d = t * 3;
      g.addColorStop(t, mix(this.panel, this.ink, clamp(DIM + (1 - DIM) / (1 + d * d))));
    }
    c.fillStyle = g;
    c.fill(this.path);
    c.restore();
  }

  /** The mark: each leg swung about its own joint and the body laid back
   *  over every cut, rendered small and blown up with smoothing off. */
  drawMark(ctx) {
    if (!this.path || !this.buf) return;
    const VH = HORSE_VIEW.h;
    const p = this.phase;
    const run = this.striding ? 1 : 0;
    const k = this.pixK;
    const bobVb = (-BOB * VH * run * (1 - Math.cos(p * Math.PI * 4))) / 2;

    const lampVb = {
      x: (this.lamp.x - this.markX) / this.markScale,
      y: (this.lamp.y - this.markY) / this.markScale - bobVb,
    };
    const Rvb = (REACH * this.ch) / this.markScale;

    const c = this.buf.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.buf.width, this.buf.height);
    c.setTransform(1, 0, 0, 1, PIX_MARGIN.l * k, (PIX_MARGIN.t + bobVb) * k);

    for (const L of LEGS) {
      const deg = RUN_DEG * run * Math.sin((p + L.phase) * Math.PI * 2);
      this.piece(c, k, [[L.x0, L.y, L.x1 - L.x0, VH - L.y + 20]], L.px, L.py, deg, lampVb, Rvb);
    }
    this.piece(c, k, BODY.map((b) => [b.x0, -VH, b.x1 - b.x0, b.y + VH]), 0, 0, 0, lampVb, Rvb);

    // Hard-edge the buffer. Scaling an antialiased render just makes big
    // soft blocks; a cell is either lit or it is not, which is what makes it
    // read as pixel art rather than as a small picture blown up.
    const img = c.getImageData(0, 0, this.buf.width, this.buf.height);
    const d = img.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 128 ? 255 : 0;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.putImageData(img, 0, 0);

    const sc = this.markScale;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.buf,
      this.markX - PIX_MARGIN.l * sc, this.markY - PIX_MARGIN.t * sc,
      (this.buf.width / k) * sc, (this.buf.height / k) * sc,
    );
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx || !this.lamp) return;
    const s = this.dpr;

    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fillStyle = PAGE;
    ctx.fillRect(0, 0, this.cw, this.ch);

    // One rounded corner. The other three run off the card, so drawing them
    // would put a radius where the eye expects the page to continue.
    const { panelX: px0, panelY: py0, radius: r } = this;
    ctx.fillStyle = PANEL;
    ctx.beginPath();
    ctx.moveTo(px0, this.ch);
    ctx.lineTo(px0, py0 + r);
    ctx.arcTo(px0, py0, px0 + r, py0, r);
    ctx.lineTo(this.cw, py0);
    ctx.lineTo(this.cw, this.ch);
    ctx.closePath();
    ctx.fill();

    this.drawMark(ctx);

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
