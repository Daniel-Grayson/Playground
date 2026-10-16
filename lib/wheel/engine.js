import {
  GROUND, INK, ACCENT, WORDS, MARK_EVERY,
  CENTER_X, CENTER_Y, RADIUS, MARK_RADIUS, SIZE, MARK_SIZE,
  DRIFT, FLICK, FRICTION_HALF, MAX_SPIN, FONT_STACK,
} from './params';
import { clamp } from '../math';

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

    this.measure();
  }

  measure() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = Math.max(1, Math.round(rect.width));
    this.ch = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.cw * this.dpr);
    this.canvas.height = Math.round(this.ch * this.dpr);
  }

  /** Vertical pointer speed becomes spin: down turns the ring clockwise,
   *  the way a dial follows a finger dragged down its right side. */
  setPointer(x, y) {
    const t = performance.now() / 1000;
    if (this.prev) {
      const dt = Math.max(1 / 240, t - this.prev.t);
      const v = (y - this.prev.y) / this.ch / dt;
      this.spin = clamp(this.spin + v * FLICK * Math.min(1, dt * 8), -MAX_SPIN, MAX_SPIN);
    }
    this.prev = { y, t };
  }

  clearPointer() { this.prev = null; }

  step(dt) {
    this.spin *= Math.pow(0.5, dt / FRICTION_HALF);
    this.angle += (DRIFT + this.spin) * dt;
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
      const a = this.angle + (i / n) * Math.PI * 2;
      const mark = i % MARK_EVERY === 0;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.font = `400 ${(mark ? MARK_SIZE : SIZE) * W}px ${FONT_STACK}`;
      ctx.fillStyle = mark ? ACCENT : INK;
      ctx.fillText(WORDS[i], (mark ? MARK_RADIUS : RADIUS) * W, 0);
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
