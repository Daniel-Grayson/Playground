import {
  GROUND, RAY, RAYS, HOLE, HOLE_JITTER, NEEDLE, MEDIUM, SEGMENT_JITTER, PROFILE,
  FOCUS_REACH, FOCUS_HALF, PULSE_SHARP, PULSE_IDLE, PULSE_FAST,
  THRUST_IDLE, THRUST_FAST, ENERGY_GAIN, ENERGY_HALF,
} from './params';
import { clamp, damp, rng } from '../math';

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
    this.focus = { x: 0, y: 0 };   // offset from card centre, CSS px
    this.energy = 0;
    this.phase = 0;                // pulse position, in revolutions

    const r = rng(41);
    this.rays = Array.from({ length: RAYS }, (_, i) => ({
      // Even spacing with a little wobble, as hand-placed rays have.
      a: ((i + (r() - 0.5) * 0.35) / RAYS) * Math.PI * 2,
      hole: (r() - 0.5) * 2,
      seg: (r() - 0.5) * 2,
    }));

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

    // Focus: toward the pointer, clamped to a disc round the middle.
    let tx = 0;
    let ty = 0;
    if (this.pointer) {
      tx = this.pointer.x - this.cw / 2;
      ty = this.pointer.y - this.ch / 2;
      const m = Math.hypot(tx, ty);
      const lim = FOCUS_REACH * H;
      if (m > lim) { tx *= lim / m; ty *= lim / m; }
    }
    this.focus.x = damp(this.focus.x, tx, FOCUS_HALF, dt);
    this.focus.y = damp(this.focus.y, ty, FOCUS_HALF, dt);

    const e = this.energy;
    this.phase = (this.phase + dt * (PULSE_IDLE + (PULSE_FAST - PULSE_IDLE) * e)) % 1;
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
    const fx = cx + this.focus.x;
    const fy = cy + this.focus.y;
    // Anchors sit on a circle well outside the card, so every ray runs off it.
    const far = Math.hypot(this.cw, this.ch);
    const thrust = (THRUST_IDLE + (THRUST_FAST - THRUST_IDLE) * this.energy) * H;
    const pa = this.phase * Math.PI * 2;

    ctx.fillStyle = RAY;
    for (const ray of this.rays) {
      const ax = cx + Math.cos(ray.a) * far;
      const ay = cy + Math.sin(ray.a) * far;
      // Aim from the anchor at the focus.
      let dx = fx - ax;
      let dy = fy - ay;
      const dist = Math.hypot(dx, dy);
      dx /= dist;
      dy /= dist;
      const bump = Math.pow(Math.max(0, Math.cos(ray.a - pa)), PULSE_SHARP);
      const hole = (HOLE + HOLE_JITTER * ray.hole) * H - thrust * bump;
      const j = 1 + SEGMENT_JITTER * ray.seg;
      // Distance from anchor to the needle's tip.
      const tip = dist - hole;
      // Bars from the tip outward: needle, medium, thick (the last runs to
      // the anchor, i.e. off the card).
      const bounds = [tip, tip - NEEDLE * j * H, tip - (NEEDLE + MEDIUM) * j * H, 0];
      const nx = -dy;
      const ny = dx;
      for (let k = 0; k < 3; k++) {
        const inner = bounds[k];
        const outer = Math.max(0, bounds[k + 1]);
        if (inner <= 0) continue;
        // PROFILE is outer-first; k counts from the needle.
        const [wOut, wIn] = PROFILE[2 - k];
        // Widths grow a little with distance from the focus, so the long
        // corner rays are bolder, as in the frame.
        const grow = 0.8 + 0.4 * clamp((dist - hole) / far);
        const hi = (wIn * H * grow) / 2;
        const ho = (wOut * H * grow) / 2;
        const ix = ax + dx * inner;
        const iy = ay + dy * inner;
        const ox = ax + dx * outer;
        const oy = ay + dy * outer;
        ctx.beginPath();
        ctx.moveTo(ix + nx * hi, iy + ny * hi);
        ctx.lineTo(ox + nx * ho, oy + ny * ho);
        ctx.lineTo(ox - nx * ho, oy - ny * ho);
        ctx.lineTo(ix - nx * hi, iy - ny * hi);
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
    this.phase = 0.6;
    this.draw();
  }

  destroy() {
    this.stop();
    this.ok = false;
  }
}
