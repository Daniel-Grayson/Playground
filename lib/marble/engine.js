import {
  TICK_HZ, STACKS, LAYERS, DROPS, DROP_R, JITTER,
  RAKE_TICKS, RAKE_ALPHA, RAKE_LAMBDA,
  COMB_TICKS, COMB_TINES, COMB_ALPHA, COMB_LAMBDA,
  CLEAR_TICKS, CLEAR_R, CLEAR_EASE, TOTAL_TICKS, RING_PTS, STACK_POS, SCENES, opAt,
} from './params';
import { rng } from '../math';

export class MarbleBath {
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

    this.rings = [];
    this.builtTick = -1;
    this.builtScene = -1;
    this.lastDrawn = -1;

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
    this.builtTick = -1;      // geometry is in device px, so it is size-bound
    this.lastDrawn = -1;
  }

  /* ---------- the two operations ---------- */

  /** Push everything outward from C, then optionally leave a new ring there. */
  drop(cx, cy, r, ink) {
    const r2 = r * r;
    for (const ring of this.rings) {
      const p = ring.p;
      for (let i = 0; i < p.length; i += 2) {
        const ax = p[i] - cx;
        const ay = p[i + 1] - cy;
        let d2 = ax * ax + ay * ay;
        if (d2 < 1e-9) d2 = 1e-9;
        const k = Math.sqrt(1 + r2 / d2);
        p[i] = cx + ax * k;
        p[i + 1] = cy + ay * k;
      }
    }
    if (!ink) return;
    const p = new Float64Array(RING_PTS * 2);
    for (let i = 0; i < RING_PTS; i++) {
      const a = (i / RING_PTS) * Math.PI * 2;
      p[i * 2] = cx + r * Math.cos(a);
      p[i * 2 + 1] = cy + r * Math.sin(a);
    }
    this.rings.push({ p, ink });
  }

  /** Drag everything along a line, falling off with perpendicular distance. */
  tine(ax, ay, ux, uy, alpha, lambda) {
    const nx = -uy;
    const ny = ux;
    const il = 1 / lambda;
    for (const ring of this.rings) {
      const p = ring.p;
      for (let i = 0; i < p.length; i += 2) {
        const d = (p[i] - ax) * nx + (p[i + 1] - ay) * ny;
        const tt = d * il;
        const f = alpha / (1 + tt * tt);
        p[i] += ux * f;
        p[i + 1] += uy * f;
      }
    }
  }

  /* ---------- the timeline ---------- */

  applyTick(n, sceneIdx) {
    const { W, H } = this;
    const sc = SCENES[sceneIdx];
    const op = opAt(n);

    if (op.kind === 'drop') {
      const layer = Math.floor(op.i / STACKS);
      const si = op.i % STACKS;
      // Seeded off the drop index, so a replay lays the sheet down identically.
      const rnd = rng(1000 + op.i * 37 + sceneIdx * 9001);
      const [sx, sy] = STACK_POS[si];
      const jx = (rnd() - 0.5) * 2 * JITTER * W;
      const jy = (rnd() - 0.5) * 2 * JITTER * H;
      // Inks step by 3 per stack as well as 1 per layer, so neighbouring
      // stacks never run the same colour sequence and every stack reads as
      // rings rather than as one solid blob.
      const ink = sc.inks[(layer + si * 3) % sc.inks.length];
      this.drop(sx * W + jx, sy * H + jy, DROP_R * H, ink);
      return;
    }

    if (op.kind === 'rake') {
      this.tine(0, H / 2, 1, 0, (RAKE_ALPHA * W) / RAKE_TICKS, RAKE_LAMBDA * H);
      return;
    }

    if (op.kind === 'comb') {
      const a = (COMB_ALPHA * H) / COMB_TICKS;
      const lam = COMB_LAMBDA * W;
      for (let k = 0; k < COMB_TINES; k++) {
        const x = ((k + 0.5) / COMB_TINES) * W;
        this.tine(x, 0, 0, k & 1 ? 1 : -1, a, lam);
      }
      return;
    }

    if (op.kind === 'clear') {
      // One drop of clear water, grown along a curve. Each tick's increment is
      // solved from the radius either side of it — dr = sqrt(r1^2 - r0^2) —
      // which is exact because drops at one centre add in r squared.
      const R = (CLEAR_R * Math.hypot(W, H)) / 2;
      const f = (u) => R * Math.pow(u, CLEAR_EASE);
      const r0 = f(op.i / CLEAR_TICKS);
      const r1 = f((op.i + 1) / CLEAR_TICKS);
      const dr = Math.sqrt(Math.max(0, r1 * r1 - r0 * r0));
      const next = SCENES[(sceneIdx + 1) % SCENES.length];
      this.drop(W / 2, H / 2, dr, op.i === 0 ? next.paper : null);
    }
  }

  seek(tick, sceneIdx) {
    if (sceneIdx !== this.builtScene || tick < this.builtTick || tick > this.builtTick + 1) {
      this.rings = [];
      this.builtScene = sceneIdx;
      for (let n = 0; n <= tick; n++) this.applyTick(n, sceneIdx);
      this.builtTick = tick;
      return;
    }
    while (this.builtTick < tick) {
      this.builtTick += 1;
      this.applyTick(this.builtTick, sceneIdx);
    }
  }

  paint(sceneIdx) {
    const ctx = this.ctx;
    const { W, H } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = SCENES[sceneIdx].paper;
    ctx.fillRect(0, 0, W, H);
    // Insertion order is draw order: a newer disc sitting on an older one is
    // what makes the older one read as a ring.
    for (const ring of this.rings) {
      const p = ring.p;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
      ctx.closePath();
      ctx.fillStyle = ring.ink;
      ctx.fill();
    }
  }

  drawAt(t) {
    if (!this.ctx) return;
    const total = Math.floor(t * TICK_HZ);
    const sceneIdx = Math.floor(total / TOTAL_TICKS) % SCENES.length;
    const tick = ((total % TOTAL_TICKS) + TOTAL_TICKS) % TOTAL_TICKS;
    this.seek(tick, sceneIdx);
    this.paint(sceneIdx);
    this.lastDrawn = total;
  }

  now() {
    return this.running ? performance.now() / 1000 - this.base : this.elapsed;
  }

  tick = () => {
    if (!this.running) return;
    // Nothing changes between ticks, so neither does the canvas.
    const total = Math.floor(this.now() * TICK_HZ);
    if (total !== this.lastDrawn) this.drawAt(this.now());
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
    // The finished sheet, before the water clears it.
    this.elapsed = (DROPS + RAKE_TICKS + COMB_TICKS + 8) / TICK_HZ;
    this.drawAt(this.elapsed);
  }

  destroy() {
    this.stop();
    this.rings = [];
    this.ctx = null;
    this.ok = false;
  }
}
