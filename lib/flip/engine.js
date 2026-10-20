import {
  GROUND, STICKERS, BOX, HOLD, HOLD_SLOW, HOLD_FAST, PLACEHOLDER_TILT,
} from './params';
import { clamp } from '../math';
import { deviceRatio } from '../dpr';

export class StickerFlip {
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
    // The beat is a phase in leaves, advanced by 1/hold each second, so a
    // change of speed never jumps the book to a different page.
    this.leaf = 0;
    this.shown = -1;

    this.imgs = STICKERS.map((src) => {
      const slot = { img: null };
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        slot.img = img;
        if (this.ok) this.draw(true);
      };
      img.src = src;
      return slot;
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
  }

  setPointer(x, y) { this.pointer = { x, y }; }
  clearPointer() { this.pointer = null; }

  hold() {
    if (!this.pointer) return HOLD;
    const t = clamp(this.pointer.x / this.cw);
    // Geometric, so equal pointer travel is an equal change in feel.
    return HOLD_SLOW * Math.pow(HOLD_FAST / HOLD_SLOW, t);
  }

  step(dt) {
    this.leaf += dt / this.hold();
  }

  /** A stand-in sticker: a white die-cut card with a dashed slot, tilted. */
  placeholder(ctx, i, size) {
    const a = (PLACEHOLDER_TILT[i % PLACEHOLDER_TILT.length] * Math.PI) / 180;
    const w = size * 0.78;
    const h = size * 0.78;
    const r = size * 0.14;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, r);
    ctx.fill();
    ctx.strokeStyle = '#110000';
    ctx.lineWidth = size * 0.02;
    ctx.setLineDash([size * 0.05, size * 0.035]);
    ctx.beginPath();
    ctx.roundRect(-w / 2 + size * 0.06, -h / 2 + size * 0.06, w - size * 0.12, h - size * 0.12, r * 0.6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#110000';
    ctx.font = `600 ${size * 0.26}px 'PP Mori', -apple-system, Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), 0, size * 0.01);
    ctx.restore();
  }

  draw(force = false) {
    const ctx = this.ctx;
    if (!ctx) return;
    const n = this.imgs.length;
    const i = ((Math.floor(this.leaf) % n) + n) % n;
    // A flipbook only changes on a cut: between cuts there is nothing to draw.
    if (!force && i === this.shown) return;
    this.shown = i;

    const s = this.dpr;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, this.cw, this.ch);

    const size = BOX * this.ch;
    ctx.translate(this.cw / 2, this.ch / 2);
    const img = this.imgs[i].img;
    if (img) {
      const k = size / Math.max(img.naturalWidth, img.naturalHeight);
      const w = img.naturalWidth * k;
      const h = img.naturalHeight * k;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      this.placeholder(ctx, i, size);
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
    this.draw(true);
  }

  renderStill() {
    this.leaf = 0;
    this.draw(true);
  }

  destroy() {
    this.stop();
    this.ok = false;
  }
}
