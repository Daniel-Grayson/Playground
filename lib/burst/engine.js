import {
  GROUND, RAY, RAYS, HOLE, NEEDLE, MEDIUM, PROFILE,
  BREATH_IDLE, BREATH_FAST, THRUST_IDLE, THRUST_FAST,
  TURN_IDLE, TURN_FAST, ENERGY_GAIN, ENERGY_HALF,
} from './params';
import { clamp } from '../math';

export class RayBurst {
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
    this.prev = null;
    this.energy = 0;
    this.breath = 0;               // in breaths
    this.turn = 0;                 // in revolutions

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

  setPointer(x, y) { this.pointer = { x, y }; }
  clearPointer() { this.pointer = null; this.prev = null; }

  step(dt) {
    const H = this.ch;
    // Energy: pumped by how far the pointer travelled, drained by time.
    if (this.pointer && this.prev) {
      const d = Math.hypot(this.pointer.x - this.prev.x, this.pointer.y - this.prev.y) / H;
      this.energy += d * ENERGY_GAIN;
    }
    this.prev = this.pointer ? { ...this.pointer } : null;
    this.energy = clamp(this.energy * Math.pow(0.5, dt / ENERGY_HALF));

    const e = this.energy;
    this.breath = (this.breath + dt * (BREATH_IDLE + (BREATH_FAST - BREATH_IDLE) * e)) % 1;
    this.turn = (this.turn + dt * (TURN_IDLE + (TURN_FAST - TURN_IDLE) * e)) % 1;
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const H = this.ch;
    const s = this.dpr;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, this.cw, this.ch);

    const cx = this.cw / 2;
    const cy = this.ch / 2;
    // One pose for every ray: how far in, and how far round.
    const thrust = (THRUST_IDLE + (THRUST_FAST - THRUST_IDLE) * this.energy) * H;
    const hole = HOLE * H - thrust * (0.5 - 0.5 * Math.cos(this.breath * Math.PI * 2));
    const far = Math.hypot(this.cw, this.ch);
    const bounds = [hole, hole + NEEDLE * H, hole + (NEEDLE + MEDIUM) * H, far];
    const rot = this.turn * Math.PI * 2;

    ctx.fillStyle = RAY;
    for (let i = 0; i < RAYS; i++) {
      const a = rot + (i / RAYS) * Math.PI * 2;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const nx = -dy;
      const ny = dx;
      // Bars from the centre outward: needle, medium, thick (off the card).
      for (let k = 0; k < 3; k++) {
        const [wOut, wIn] = PROFILE[2 - k];
        const hi = (wIn * H) / 2;
        const ho = (wOut * H) / 2;
        const r0 = bounds[k];
        const r1 = bounds[k + 1];
        ctx.beginPath();
        ctx.moveTo(cx + dx * r0 + nx * hi, cy + dy * r0 + ny * hi);
        ctx.lineTo(cx + dx * r1 + nx * ho, cy + dy * r1 + ny * ho);
        ctx.lineTo(cx + dx * r1 - nx * ho, cy + dy * r1 - ny * ho);
        ctx.lineTo(cx + dx * r0 - nx * hi, cy + dy * r0 - ny * hi);
        ctx.closePath();
        ctx.fill();
      }
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
    this.breath = 0;
    this.draw();
  }

  destroy() {
    this.stop();
    this.ok = false;
  }
}
