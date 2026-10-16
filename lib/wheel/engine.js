import {
  GROUND, INK, ACCENT, WORDS,
  CENTER_X, CENTER_Y, RADIUS, MARK_RADIUS, SIZE, MARK_SIZE,
  DRIFT, FLICK, FRICTION_HALF, MAX_SPIN, FONT_STACK, HOVER_UP, HOVER_DOWN,
} from './params';
import { clamp, lerp } from '../math';

const TAU = Math.PI * 2;
const rgb = (hex) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
const INK_RGB = rgb(INK);
const ACCENT_RGB = rgb(ACCENT);

export class WordWheel {
  ok = false;

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ok = true;

    this.raf = 0;
    this.running = false;
    this.last = 0;
    this.angle = 0;
    this.spin = 0;       // extra angular velocity from flicks, rad/s
    this.prev = null;    // last pointer sample { y, t }
    this.pointer = null;
    this.hovered = -1;
    // One damped number per word: 0 is small and white, 1 is large and in
    // the accent. The hovered word's goes to 1, every other's back to 0.
    this.lit = new Float32Array(WORDS.length);

    this.measure();
  }

  measure() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = Math.max(1, Math.round(rect.width));
    this.ch = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.cw * this.dpr);
    this.canvas.height = Math.round(this.ch * this.dpr);
    // Each word's length at the small size, for hit testing.
    const ctx = this.ctx;
    ctx.font = `400 ${SIZE * this.cw}px ${FONT_STACK}`;
    this.lens = WORDS.map((w) => ctx.measureText(w).width);
  }

  /** Vertical pointer speed becomes spin: down turns the ring clockwise,
   *  the way a dial follows a finger dragged down its right side. */
  setPointer(x, y) {
    this.pointer = { x, y };
    const t = performance.now() / 1000;
    if (this.prev) {
      const dt = Math.max(1 / 240, t - this.prev.t);
      const v = (y - this.prev.y) / this.ch / dt;
      this.spin = clamp(this.spin + v * FLICK * Math.min(1, dt * 8), -MAX_SPIN, MAX_SPIN);
    }
    this.prev = { y, t };
  }

  clearPointer() { this.prev = null; this.pointer = null; }

  /** The word under the pointer, read in the ring's own polar coordinates:
   *  the pointer's angle picks the nearest spoke, its radius has to fall
   *  along that word. */
  hit(p) {
    if (!p) return -1;
    const W = this.cw;
    const dx = p.x - CENTER_X * W;
    const dy = p.y - CENTER_Y * this.ch;
    const r = Math.hypot(dx, dy);
    const n = WORDS.length;
    const step = TAU / n;
    let rel = (Math.atan2(dy, dx) - this.angle) / step;
    const i = ((Math.round(rel) % n) + n) % n;
    const off = Math.abs(rel - Math.round(rel)) * step * r;   // across the spoke
    const r0 = RADIUS * W;
    if (off > SIZE * W * 0.8) return -1;
    if (r < r0 - SIZE * W * 0.5 || r > r0 + this.lens[i] + SIZE * W) return -1;
    return i;
  }

  step(dt) {
    this.spin *= Math.pow(0.5, dt / FRICTION_HALF);
    this.angle += (DRIFT + this.spin) * dt;
    this.hovered = this.hit(this.pointer);
    for (let i = 0; i < this.lit.length; i++) {
      const goal = i === this.hovered ? 1 : 0;
      const h = goal > this.lit[i] ? HOVER_UP : HOVER_DOWN;
      this.lit[i] += (goal - this.lit[i]) * (1 - Math.pow(0.5, dt / h));
    }
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const W = this.cw;
    const d = this.dpr;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, this.cw, this.ch);

    const cx = CENTER_X * W;
    const cy = CENTER_Y * this.ch;
    const n = WORDS.length;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    for (let i = 0; i < n; i++) {
      const a = this.angle + (i / n) * TAU;
      const k = this.lit[i];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.font = `400 ${lerp(SIZE, MARK_SIZE, k) * W}px ${FONT_STACK}`;
      const c = INK_RGB.map((v, j) => Math.round(lerp(v, ACCENT_RGB[j], k)));
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.fillText(WORDS[i], lerp(RADIUS, MARK_RADIUS, k) * W, 0);
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
