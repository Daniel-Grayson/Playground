import {
  GROUND, PINK, OUTLINE, CONFETTI, PIECES, HEART_W, STROKE, SPREAD,
  FPS, PRESS, BURST, LAND_FROM, LAND_DECAY, HOLD, HIT,
} from './params';
import { rng } from '../math';
import { deviceRatio } from '../dpr';

/** Sample a per-frame table at time t (s), linearly between frames. */
function table(tab, t) {
  const f = t * FPS;
  const i = Math.floor(f);
  if (i >= tab.length - 1) return tab[tab.length - 1];
  if (i < 0) return tab[0];
  return tab[i] + (tab[i + 1] - tab[i]) * (f - i);
}

const T_PRESS = (PRESS.length - 1) / FPS;
const T_BURST = BURST.length / FPS;

/** A heart of unit width centred on the origin, as a path. */
function heartPath(ctx, w) {
  const s = w / 2;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.82);
  ctx.bezierCurveTo(-s * 0.18, s * 0.66, -s, s * 0.12, -s, -s * 0.34);
  ctx.bezierCurveTo(-s, -s * 0.74, -s * 0.68, -s * 0.98, -s * 0.44, -s * 0.98);
  ctx.bezierCurveTo(-s * 0.2, -s * 0.98, -s * 0.06, -s * 0.84, 0, -s * 0.66);
  ctx.bezierCurveTo(s * 0.06, -s * 0.84, s * 0.2, -s * 0.98, s * 0.44, -s * 0.98);
  ctx.bezierCurveTo(s * 0.68, -s * 0.98, s, -s * 0.74, s, -s * 0.34);
  ctx.bezierCurveTo(s, s * 0.12, s * 0.18, s * 0.66, 0, s * 0.82);
  ctx.closePath();
}

export class LikeConfetti {
  ok = false;

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ok = true;

    this.raf = 0;
    this.running = false;
    this.last = 0;

    // 'empty' → 'press' → 'burst' → 'land' → 'liked'; unlike cuts to 'empty'.
    this.state = 'empty';
    this.t = 0;
    this.dirty = true;

    const r = rng(23);
    this.pieces = Array.from({ length: PIECES }, (_, i) => {
      const a = r() * Math.PI * 2;
      // sqrt keeps the cloud evenly filled rather than bunched at the middle;
      // the floor keeps the heart's own space clear.
      const d = 0.3 + 0.7 * Math.sqrt(r());
      return {
        hx: Math.cos(a) * d,
        hy: Math.sin(a) * d * 0.88,
        kind: ['rect', 'rect', 'dot', 'curl', 'tri'][Math.floor(r() * 5)],
        color: CONFETTI[i % CONFETTI.length],
        size: 0.6 + r() * 0.6,
        a0: r() * Math.PI * 2,
        spin: (r() < 0.5 ? -1 : 1) * (3 + r() * 7),
        flip: 6 + r() * 10,
        phase: r() * Math.PI * 2,
      };
    });

    this.measure();
  }

  measure() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = deviceRatio();
    this.cw = Math.max(1, Math.round(rect.width));
    this.ch = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.cw * this.dpr);
    this.canvas.height = Math.round(this.ch * this.dpr);
    this.dirty = true;
  }

  setPointer() {}
  clearPointer() {}

  /** Is (x, y) on the heart? A circle around it a little wider than the
   *  heart itself, so the button is forgiving at its notch and point but the
   *  ground around it is not a button. */
  hits(x, y) {
    const r = (HEART_W * this.ch) * HIT;
    const dx = x - this.cw / 2;
    const dy = y - this.ch / 2;
    return dx * dx + dy * dy <= r * r;
  }

  /** One press: like from empty, unlike from liked. Mid-reaction presses are
   *  ignored, so the burst always lands. */
  press(reduced = false) {
    if (this.state === 'empty') {
      this.state = reduced ? 'liked' : 'press';
    } else if (this.state === 'liked' || this.state === 'land') {
      this.state = 'empty';
    } else {
      return;
    }
    this.t = 0;
    this.dirty = true;
  }

  step(dt) {
    if (this.state === 'empty') return;
    this.t += dt;
    if (this.state === 'liked') {
      // The hold: a hard cut back to the outline, as an unlike is.
      if (this.t >= HOLD) { this.state = 'empty'; this.t = 0; this.dirty = true; }
      return;
    }
    this.dirty = true;
    if (this.state === 'press' && this.t >= T_PRESS) { this.state = 'burst'; this.t -= T_PRESS; }
    if (this.state === 'burst' && this.t >= T_BURST) { this.state = 'land'; this.t -= T_BURST; }
    if (this.state === 'land' && LAND_FROM - 1 > 0
      && (LAND_FROM - 1) * Math.pow(LAND_DECAY, this.t * FPS) < 0.002) {
      this.state = 'liked';
      // The hold counts from when the heart landed, not from when it settled.
    }
  }

  drawPiece(ctx, p, spread, t, unit) {
    const R = SPREAD * this.ch;
    const x = p.hx * R * spread;
    const y = p.hy * R * spread;
    const s = unit * p.size * (0.55 + 0.45 * spread);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p.a0 + p.spin * t);
    // The flutter: a flat piece turning about its own long axis.
    ctx.scale(1, Math.cos(p.phase + p.flip * t));
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    switch (p.kind) {
      case 'rect':
        ctx.fillRect(-s, -s * 0.42, s * 2, s * 0.84);
        break;
      case 'dot':
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.62, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'tri':
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.8);
        ctx.lineTo(s * 0.75, s * 0.55);
        ctx.lineTo(-s * 0.75, s * 0.55);
        ctx.closePath();
        ctx.fill();
        break;
      default: {
        ctx.lineWidth = s * 0.42;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let k = 0; k <= 12; k++) {
          const u = k / 12;
          const px = (u - 0.5) * s * 2.4;
          const py = Math.sin(u * Math.PI * 2) * s * 0.45;
          if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx || !this.dirty) return;
    this.dirty = false;
    const d = this.dpr;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, this.cw, this.ch);
    ctx.translate(this.cw / 2, this.ch / 2);

    const w = HEART_W * this.ch;
    const outline = (k) => {
      ctx.save();
      ctx.scale(k, k);
      heartPath(ctx, w * (1 - STROKE));
      ctx.lineWidth = w * STROKE;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      ctx.restore();
    };
    const filled = (k) => {
      ctx.save();
      ctx.scale(k, k);
      heartPath(ctx, w);
      ctx.fillStyle = PINK;
      ctx.fill();
      ctx.restore();
    };

    switch (this.state) {
      case 'empty': outline(1); break;
      case 'press': outline(table(PRESS, this.t)); break;
      case 'burst': {
        const spread = table(BURST, this.t);
        const unit = 0.03 * this.ch;
        for (const p of this.pieces) this.drawPiece(ctx, p, spread, this.t, unit);
        break;
      }
      case 'land':
        filled(1 + (LAND_FROM - 1) * Math.pow(LAND_DECAY, this.t * FPS));
        break;
      default: filled(1);
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
    this.dirty = true;
    this.draw();
  }

  destroy() {
    this.stop();
    this.ok = false;
  }
}
