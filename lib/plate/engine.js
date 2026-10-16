import {
  PLATE_SRC, POS_DARK, POS_LIGHT, NEG_DARK, NEG_LIGHT,
  CONTRAST, GRAIN, VIGNETTE, VIGNETTE_WOBBLE,
  GRID_ROWS, TICK_HZ, MAX_TICKS, DIFFUSE, COOL_HALF,
  BRUSH_R, BRUSH_HEAT, DEV_LO, DEV_HI, SMOKE_SCALE, SMOKE_OCTAVES, SMOKE_DRIFT, SMOKE_AMT,
  RISE_HALF, FALL_HALF, IDLE_AFTER, IDLE_FADE, IDLE_HEAT, idleAt,
} from './params';
import { clamp, fbm, rng } from '../math';

const DT = 1 / TICK_HZ;
const COOL = Math.pow(0.5, DT / COOL_HALF);
const RISE = 1 - Math.pow(0.5, DT / RISE_HALF);
const FALL = 1 - Math.pow(0.5, DT / FALL_HALF);

export class PlateDevelop {
  ok = false;

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ok = true;

    this.raf = 0;
    this.running = false;
    this.simT = 0;          // simulated seconds; the idle path is a function of this
    this.acc = 0;
    this.last = 0;

    this.pointer = null;    // { x, y } in grid cells
    this.prev = null;       // where the brush was at the previous tick
    this.sincePointer = IDLE_AFTER + IDLE_FADE;

    this.gw = 0;
    this.gh = GRID_ROWS;
    this.heat = null;
    this.dev = null;

    this.neg = document.createElement('canvas');
    this.pos = document.createElement('canvas');
    this.mask = document.createElement('canvas');
    this.scratch = document.createElement('canvas');

    this.img = null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!this.ok) return;
      this.img = img;
      this.bake();
      if (!this.running) this.draw();
    };
    img.src = PLATE_SRC;

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
    for (const c of [this.neg, this.pos, this.scratch]) {
      c.width = this.W;
      c.height = this.H;
    }

    // The field is in cells, so it survives a resize as long as the aspect
    // does. Only a change in column count starts it over.
    const gw = Math.max(8, Math.round(GRID_ROWS * (this.cw / this.ch)));
    if (gw !== this.gw) {
      this.gw = gw;
      this.heat = new Float32Array(gw * this.gh);
      this.dev = new Float32Array(gw * this.gh);
      this.tmp = new Float32Array(gw * this.gh);
      this.mask.width = gw;
      this.mask.height = this.gh;
      this.maskCtx = this.mask.getContext('2d');
      this.maskData = this.maskCtx.createImageData(gw, this.gh);
    }
    if (this.img) this.bake();
  }

  /* ---------- the two tonings of one photograph ---------- */

  bake() {
    const { W, H, img } = this;
    const src = this.scratch.getContext('2d');
    // Cover-fit, centred.
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    src.globalCompositeOperation = 'copy';
    src.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    src.globalCompositeOperation = 'source-over';
    const px = src.getImageData(0, 0, W, H).data;

    const negCtx = this.neg.getContext('2d');
    const posCtx = this.pos.getContext('2d');
    const negImg = negCtx.createImageData(W, H);
    const posImg = posCtx.createImageData(W, H);
    const n = negImg.data;
    const p = posImg.data;

    // Grain is hashed per CSS pixel so it is the same size at dpr 1 and 2.
    const r = rng(1867);
    const gcw = this.cw + 1;
    const grain = new Float32Array(gcw * (this.ch + 1));
    for (let i = 0; i < grain.length; i++) grain[i] = (r() - 0.5) * 2 * GRAIN;

    const aspect = W / H;
    for (let y = 0; y < H; y++) {
      const v = y / H;
      const gy = Math.floor(y / this.dpr) * gcw;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const u = x / W;
        let g = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
        g = clamp(0.5 + (g - 0.5) * CONTRAST);

        // The poured edge of the plate: an elliptical falloff whose radius
        // wobbles, so the dark border is uneven the way collodion is.
        const ex = (u - 0.5) * aspect / ((aspect + 1) / 2);
        const ey = v - 0.5;
        const wob = 1 + VIGNETTE_WOBBLE * fbm(u * 3.1, v * 3.1, 3);
        const e = clamp((Math.sqrt(ex * ex + ey * ey) * 1.55 * wob - 0.45) / 0.55);
        g *= 1 - VIGNETTE * e * e;

        g = clamp(g + grain[gy + Math.floor(x / this.dpr)]);

        // Toning is applied to g before the split, so grain, vignette and
        // contrast are identical in both and the d = 0.5 identity still holds.
        for (let c = 0; c < 3; c++) {
          p[i + c] = POS_DARK[c] + g * (POS_LIGHT[c] - POS_DARK[c]);
          n[i + c] = NEG_DARK[c] + (1 - g) * (NEG_LIGHT[c] - NEG_DARK[c]);
        }
        p[i + 3] = 255;
        n[i + 3] = 255;
      }
    }
    negCtx.putImageData(negImg, 0, 0);
    posCtx.putImageData(posImg, 0, 0);
  }

  /* ---------- the heat field ---------- */

  setPointer(x, y) {
    this.pointer = { x: (x / this.cw) * this.gw, y: (y / this.ch) * this.gh };
  }

  clearPointer() {
    this.pointer = null;
    this.prev = null;
  }

  /** Lay heat along the segment a->b, so a fast stroke stays continuous. */
  stamp(ax, ay, bx, by, amount) {
    const { gw, gh, heat } = this;
    const R = BRUSH_R * gh;
    const len = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(1, Math.ceil(len / (R * 0.35)));
    const per = amount / steps;
    const inv = 1 / (R * R * 0.5);
    for (let s = 0; s < steps; s++) {
      const t = (s + 0.5) / steps;
      const cx = ax + (bx - ax) * t;
      const cy = ay + (by - ay) * t;
      const x0 = Math.max(0, Math.floor(cx - R * 1.6));
      const x1 = Math.min(gw - 1, Math.ceil(cx + R * 1.6));
      const y0 = Math.max(0, Math.floor(cy - R * 1.6));
      const y1 = Math.min(gh - 1, Math.ceil(cy + R * 1.6));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const dx = x + 0.5 - cx;
          const dy = y + 0.5 - cy;
          heat[y * gw + x] += per * Math.exp(-(dx * dx + dy * dy) * inv);
        }
      }
    }
  }

  tick() {
    const { gw, gh, heat, dev, tmp } = this;
    this.simT += DT;
    this.sincePointer = this.pointer ? 0 : this.sincePointer + DT;

    if (this.pointer) {
      const a = this.prev ?? this.pointer;
      this.stamp(a.x, a.y, this.pointer.x, this.pointer.y, BRUSH_HEAT * DT);
      this.prev = { ...this.pointer };
    }

    const idle = clamp((this.sincePointer - IDLE_AFTER) / IDLE_FADE);
    if (idle > 0) {
      const p = idleAt(this.simT);
      const p0 = idleAt(this.simT - DT);
      this.stamp(p0.x * gw, p0.y * gh, p.x * gw, p.y * gh, BRUSH_HEAT * IDLE_HEAT * idle * DT);
    }

    // Diffuse toward the neighbour mean, then cool. Edges reflect.
    for (let y = 0; y < gh; y++) {
      const ym = y > 0 ? y - 1 : 0;
      const yp = y < gh - 1 ? y + 1 : gh - 1;
      for (let x = 0; x < gw; x++) {
        const xm = x > 0 ? x - 1 : 0;
        const xp = x < gw - 1 ? x + 1 : gw - 1;
        const c = heat[y * gw + x];
        const avg = (heat[y * gw + xm] + heat[y * gw + xp] + heat[ym * gw + x] + heat[yp * gw + x]) * 0.25;
        tmp[y * gw + x] = (c + (avg - c) * DIFFUSE) * COOL;
      }
    }
    heat.set(tmp);

    // Heat -> development, through moving smoke. The noise multiplies, so a
    // cold cell can never develop by itself.
    const sz = this.simT * SMOKE_DRIFT;
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = y * gw + x;
        const h = heat[i];
        let target = 0;
        if (h > 1e-3) {
          const n = fbm(x * SMOKE_SCALE, y * SMOKE_SCALE - sz, SMOKE_OCTAVES);
          const k = clamp((h * (1 + SMOKE_AMT * n) - DEV_LO) / (DEV_HI - DEV_LO));
          target = k * k * (3 - 2 * k);
        } else if (h !== 0) {
          heat[i] = 0;
        }
        const d = dev[i];
        dev[i] = d + (target - d) * (target > d ? RISE : FALL);
        if (dev[i] < 1e-4) dev[i] = 0;
      }
    }
  }

  /* ---------- the frame ---------- */

  draw() {
    const { ctx, W, H } = this;
    if (!this.img) {
      ctx.fillStyle = `rgb(${NEG_DARK.join(',')})`;
      ctx.fillRect(0, 0, W, H);
      return;
    }
    const m = this.maskData.data;
    const dev = this.dev;
    let any = false;
    for (let i = 0; i < dev.length; i++) {
      const a = dev[i];
      if (a > 0) any = true;
      m[i * 4 + 3] = a * 255;
    }

    ctx.globalCompositeOperation = 'copy';
    ctx.drawImage(this.neg, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    if (!any) return;

    // Positive over negative with d as alpha: the linear blend, done by the
    // compositor. The mask is upscaled with smoothing, which is the softness.
    this.maskCtx.putImageData(this.maskData, 0, 0);
    const s = this.scratch.getContext('2d');
    s.globalCompositeOperation = 'copy';
    s.imageSmoothingEnabled = true;
    s.imageSmoothingQuality = 'high';
    s.drawImage(this.mask, 0, 0, W, H);
    s.globalCompositeOperation = 'source-in';
    s.drawImage(this.pos, 0, 0);
    s.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.scratch, 0, 0);
  }

  loop = (now) => {
    if (!this.running) return;
    const dt = Math.max(0, (now - this.last) / 1000);
    this.last = now;
    this.acc = Math.min(this.acc + dt, MAX_TICKS * DT);
    while (this.acc >= DT) {
      this.tick();
      this.acc -= DT;
    }
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

  /** Reduced motion: let the idle source work for a few seconds, then hold. */
  renderStill() {
    this.sincePointer = IDLE_AFTER + IDLE_FADE;
    for (let i = 0; i < TICK_HZ * 4; i++) this.tick();
    this.draw();
  }

  /** Seek by simulation: used by probes, not by the page. */
  runFor(seconds) {
    const n = Math.round(seconds * TICK_HZ);
    for (let i = 0; i < n; i++) this.tick();
    this.draw();
  }

  destroy() {
    this.stop();
    this.ok = false;
  }
}
