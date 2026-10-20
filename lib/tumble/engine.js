import { deviceRatio } from '../dpr';

import {
  R_FRAC, R_MIN, R_MAX, CROSS_SEC, GAP_SEC, WOB1, WOB2, WOB_L1, WOB_L2, START,
  POKE_PX, GAP_INK, PALETTES, LOOP_SEC, FACES,
} from './params';

const TAU = Math.PI * 2;

export class TumbleBlocks {
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
    this.poke = false;
    this.px = 0;
    this.py = 0;

    this.measure();
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

    this.R = Math.min(R_MAX, Math.max(R_MIN, this.ch * R_FRAC)) * this.dpr;
    this.dx = Math.sqrt(3) * this.R;
    this.dy = 1.5 * this.R;
    this.V = this.W / CROSS_SEC;
    this.x0 = START * this.W;
    this.a1 = WOB1 * this.W;
    this.a2 = WOB2 * this.W;
    this.l1 = WOB_L1 * this.dpr;
    this.l2 = WOB_L2 * this.dpr;
    this.poke2 = (POKE_PX * this.dpr) ** 2;

    // Unit hexagon, so each cell is six adds rather than six cos/sin calls.
    this.ux = [];
    this.uy = [];
    for (let i = 0; i < 6; i++) {
      const a = (-90 + 60 * i) * (Math.PI / 180);
      this.ux.push(Math.cos(a) * this.R);
      this.uy.push(Math.sin(a) * this.R);
    }
  }

  /** How many fronts have passed this cell. Solved, not counted. */
  generation(cx, cy, t) {
    const wob = this.a1 * Math.sin(cy / this.l1) + this.a2 * Math.sin(cy / this.l2 + 1.3);
    const g = Math.floor((t - (cx - wob + this.x0) / this.V) / GAP_SEC) + 1;
    return g > 0 ? g : 0;
  }

  drawAt(t) {
    const ctx = this.ctx;
    if (!ctx) return;
    const { W, H, R, dx, dy, ux, uy } = this;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = GAP_INK;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(18,13,22,0.55)';
    ctx.lineWidth = Math.max(1, 1.1 * this.dpr);
    ctx.lineJoin = 'round';

    const rows = Math.ceil(H / dy) + 2;
    const cols = Math.ceil(W / dx) + 2;

    for (let j = -1; j < rows; j++) {
      const cy = j * dy;
      for (let i = -1; i < cols; i++) {
        const cx = i * dx + (j & 1 ? dx / 2 : 0);

        let g = this.generation(cx, cy, t);
        // The pointer is one more front, shaped like a disc.
        if (this.poke) {
          const ddx = cx - this.px;
          const ddy = cy - this.py;
          if (ddx * ddx + ddy * ddy < this.poke2) g += 1;
        }

        const pal = PALETTES[g % PALETTES.length];
        const rot = g % 3;

        for (let f = 0; f < 3; f++) {
          const [a, b, c] = FACES[f];
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + ux[a], cy + uy[a]);
          ctx.lineTo(cx + ux[b], cy + uy[b]);
          ctx.lineTo(cx + ux[c], cy + uy[c]);
          ctx.closePath();
          ctx.fillStyle = pal[(f + rot) % 3];
          ctx.fill();
          ctx.stroke();
        }
      }
    }
    void R;
  }

  setPointer(xCss, yCss) {
    this.px = xCss * this.dpr;
    this.py = yCss * this.dpr;
    this.poke = true;
  }

  clearPointer() {
    this.poke = false;
  }

  now() {
    const t = this.running ? performance.now() / 1000 - this.base : this.elapsed;
    return ((t % LOOP_SEC) + LOOP_SEC) % LOOP_SEC;
  }

  tick = () => {
    if (!this.running) return;
    this.drawAt(this.now());
    this.raf = requestAnimationFrame(this.tick);
  };

  start() {
    if (!this.ok || this.running) return;
    this.running = true;
    this.base = performance.now() / 1000 - this.elapsed;
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
    // Parked with a front about halfway across, so the still shows the seam.
    this.elapsed = GAP_SEC * 2 + CROSS_SEC * 0.5;
    this.drawAt(this.elapsed);
  }

  destroy() {
    this.stop();
    this.ctx = null;
    this.ok = false;
  }
}
