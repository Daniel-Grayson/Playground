import {
  GROUND, GRID, GRID_CELL, LINKS, CHAIN_W, CHAIN_H, FIT,
  SWAY_IDLE, SWAY_WIND, SPEED_IDLE, SPEED_WIND, WIND_RISE, WIND_FALL, HOVER_PAD, OPEN,
} from './params';

const DEG = Math.PI / 180;

/** Joints between neighbours, in chain pixels, on the shared edge.
 *  `open` slides each joint from the middle of the stretch of edge the two
 *  photos share (0, a hinge along the whole edge) to the end of it that is
 *  a corner of the OUTER photo — the one further from the fixed middle — so
 *  in full wind every photo hangs from its neighbour by one corner tip, and
 *  turning about that tip swings the rest of the shared edge open. */
function joints(mid, open) {
  const out = [];
  for (let i = 0; i < LINKS.length - 1; i++) {
    const a = LINKS[i];
    const b = LINKS[i + 1];
    const lo = Math.max(a.y, b.y);
    const hi = Math.min(a.y + a.h, b.y + b.h);
    const outer = i < mid ? a : b;
    // Which end of the shared stretch is one of the outer photo's corners.
    const tip = lo === outer.y ? lo : hi === outer.y + outer.h ? hi : lo;
    const m = (lo + hi) / 2;
    out.push({ x: a.x + a.w, y: m + (tip - m) * open });
  }
  return out;
}

export class PhotoChain {
  ok = false;

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ok = true;

    this.raf = 0;
    this.running = false;
    this.last = 0;
    this.pointer = null;
    this.wind = 0;
    this.phase = 0;

    this.mid = Math.floor((LINKS.length - 1) / 2);
    this.J = joints(this.mid, 0);
    this.links = LINKS.map((l) => {
      const slot = { ...l, img: null };
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { slot.img = img; };
      img.src = l.src;
      return slot;
    });

    this.measure();
  }

  measure() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = Math.max(1, Math.round(rect.width));
    this.ch = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.cw * this.dpr);
    this.canvas.height = Math.round(this.ch * this.dpr);
    // Chain pixels → CSS px, centred.
    this.k = (this.cw * FIT) / CHAIN_W;
    this.ox = (this.cw - CHAIN_W * this.k) / 2;
    this.oy = (this.ch - CHAIN_H * this.k) / 2;
  }

  setPointer(x, y) { this.pointer = { x, y }; }
  clearPointer() { this.pointer = null; }

  over(p) {
    if (!p) return false;
    const pad = HOVER_PAD * this.ch;
    const k = this.k;
    return this.links.some((l) => p.x >= this.ox + l.x * k - pad && p.x <= this.ox + (l.x + l.w) * k + pad
      && p.y >= this.oy + l.y * k - pad && p.y <= this.oy + (l.y + l.h) * k + pad);
  }

  step(dt) {
    const target = this.over(this.pointer) ? 1 : 0;
    const h = target > this.wind ? WIND_RISE : WIND_FALL;
    this.wind += (target - this.wind) * (1 - Math.pow(0.5, dt / h));
    this.phase += dt * (SPEED_IDLE + (SPEED_WIND - SPEED_IDLE) * this.wind);
  }

  /** Lay the links end to end from the middle joint outward. Returns, per
   *  link, its pivot in chain pixels (world), the pivot in its own frame,
   *  and its turn. */
  pose() {
    const N = this.links.length;
    const A = (SWAY_IDLE + (SWAY_WIND - SWAY_IDLE) * this.wind) * DEG;
    const th = this.links.map((_, i) => A * Math.sin((this.phase - i / N) * Math.PI * 2));
    const J = joints(this.mid, this.wind * OPEN);
    this.J = J;
    const W = new Array(J.length);
    W[this.mid] = { ...J[this.mid] };
    // Forward: link i hangs from joint i-1 and carries joint i.
    for (let i = this.mid + 1; i < J.length; i++) {
      const dx = J[i].x - J[i - 1].x;
      const dy = J[i].y - J[i - 1].y;
      const c = Math.cos(th[i]);
      const s = Math.sin(th[i]);
      W[i] = { x: W[i - 1].x + dx * c - dy * s, y: W[i - 1].y + dx * s + dy * c };
    }
    // Backward: link i carries joint i-1 from joint i.
    for (let i = this.mid; i >= 1; i--) {
      const dx = J[i - 1].x - J[i].x;
      const dy = J[i - 1].y - J[i].y;
      const c = Math.cos(th[i]);
      const s = Math.sin(th[i]);
      W[i - 1] = { x: W[i].x + dx * c - dy * s, y: W[i].y + dx * s + dy * c };
    }
    return this.links.map((l, i) => {
      // Links up to the middle turn about their right joint, the rest about
      // their left one, so every link turns about the joint nearer the fixed
      // middle — the one it is hung from.
      const j = i <= this.mid ? i : i - 1;
      const at = W[Math.min(j, W.length - 1)];
      const local = J[Math.min(j, J.length - 1)];
      return { at, px: local.x - l.x, py: local.y - l.y, th: th[i] };
    });
  }

  drawGrid(ctx) {
    const cell = GRID_CELL * CHAIN_H * this.k;
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const x0 = this.ox % cell;
    const y0 = this.oy % cell;
    for (let x = x0; x <= this.cw; x += cell) {
      const X = Math.round(x * this.dpr) / this.dpr + 0.5 / this.dpr;
      ctx.moveTo(X, 0);
      ctx.lineTo(X, this.ch);
    }
    for (let y = y0; y <= this.ch; y += cell) {
      const Y = Math.round(y * this.dpr) / this.dpr + 0.5 / this.dpr;
      ctx.moveTo(0, Y);
      ctx.lineTo(this.cw, Y);
    }
    ctx.stroke();
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const d = this.dpr;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, this.cw, this.ch);
    this.drawGrid(ctx);

    const k = this.k;
    const P = this.pose();
    this.links.forEach((l, i) => {
      const p = P[i];
      ctx.save();
      ctx.translate(this.ox + p.at.x * k, this.oy + p.at.y * k);
      ctx.rotate(p.th);
      ctx.scale(k, k);
      const x = -p.px;
      const y = -p.py;
      // A shadow under each photo, growing with the wind, so a join reads
      // as two separate photos pulling apart.
      const w = this.wind;
      ctx.shadowColor = `rgba(0,0,0,${0.08 + 0.17 * w})`;
      ctx.shadowBlur = (2 + 10 * w) * this.dpr;
      ctx.shadowOffsetY = (1 + 4 * w) * this.dpr;
      if (l.img) {
        // Cover-crop the photo into its frame.
        const iw = l.img.naturalWidth;
        const ih = l.img.naturalHeight;
        const s = Math.max(l.w / iw, l.h / ih);
        const sw = l.w / s;
        const sh = l.h / s;
        ctx.drawImage(l.img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, l.w, l.h);
      } else {
        ctx.fillStyle = '#d9d9d9';
        ctx.fillRect(x, y, l.w, l.h);
      }
      ctx.restore();
    });
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
