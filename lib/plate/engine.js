import {
  PLATES, POS_DARK, POS_LIGHT, NEG_DARK, NEG_LIGHT,
  CONTRAST, GRAIN, VIGNETTE, VIGNETTE_WOBBLE,
  GRID_ROWS, TICK_HZ, MAX_TICKS, DIFFUSE, COOL_HALF,
  BRUSH_R, BRUSH_HEAT, DEV_LO, DEV_HI, SMOKE_SCALE, SMOKE_OCTAVES, SMOKE_DRIFT, SMOKE_AMT,
  RISE_HALF, FALL_HALF, CYCLE, SWEEP, RING_W, RING_HEAT, FORCE_LAG, originOf,
} from './params';
import { clamp, fbm, rng } from '../math';
import { deviceRatio } from '../dpr';

const DT = 1 / TICK_HZ;
const COOL = Math.pow(0.5, DT / COOL_HALF);
const RISE = 1 - Math.pow(0.5, DT / RISE_HALF);
const FALL = 1 - Math.pow(0.5, DT / FALL_HALF);

const canvas2d = () => document.createElement('canvas');

export class PlateDevelop {
  ok = false;

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ok = true;

    this.raf = 0;
    this.running = false;
    this.simT = 0;
    this.acc = 0;
    this.last = 0;

    this.pointer = null;    // { x, y } in grid cells
    this.prev = null;

    this.gw = 0;
    this.gh = GRID_ROWS;

    // Plate k is shown as PLATES[k % n]. `cur` is on the plate; during a sweep
    // `swapped` marks the cells already showing cur + 1.
    this.cur = 0;
    this.sweep = null;      // { start, ox, oy, rMax }
    this.nextCycle = CYCLE;

    this.N = canvas2d();    // the negative on show, composed per frame mid-sweep
    this.P = canvas2d();    // the positive on show, likewise
    this.T = canvas2d();    // masking scratch
    this.dMask = canvas2d();
    this.sMask = canvas2d();

    this.plates = PLATES.map((src) => {
      const p = { img: null, neg: canvas2d(), pos: canvas2d(), baked: false };
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (!this.ok) return;
        p.img = img;
        this.bake(p);
        if (!this.running) this.draw();
      };
      img.src = src;
      return p;
    });

    this.measure();
  }

  plate(k) {
    return this.plates[k % this.plates.length];
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
    for (const c of [this.N, this.P, this.T]) {
      c.width = this.W;
      c.height = this.H;
    }

    // The field is in cells, so it survives a resize as long as the aspect
    // does. Only a change in column count starts it over.
    const gw = Math.max(8, Math.round(GRID_ROWS * (this.cw / this.ch)));
    if (gw !== this.gw) {
      this.gw = gw;
      const n = gw * this.gh;
      this.heat = new Float32Array(n);
      this.dev = new Float32Array(n);
      this.tmp = new Float32Array(n);
      this.swapped = new Uint8Array(n);
      this.swapCount = 0;
      if (this.sweep) this.endSweep();
      for (const c of [this.dMask, this.sMask]) {
        c.width = gw;
        c.height = this.gh;
      }
      this.dCtx = this.dMask.getContext('2d');
      this.sCtx = this.sMask.getContext('2d');
      this.dData = this.dCtx.createImageData(gw, this.gh);
      this.sData = this.sCtx.createImageData(gw, this.gh);
    }
    for (const p of this.plates ?? []) if (p.img) this.bake(p);
  }

  /* ---------- the two tonings of one photograph ---------- */

  bake(plate) {
    const { W, H } = this;
    const { img } = plate;
    plate.neg.width = plate.pos.width = W;
    plate.neg.height = plate.pos.height = H;

    const src = this.T.getContext('2d');
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    src.globalCompositeOperation = 'copy';
    src.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    src.globalCompositeOperation = 'source-over';
    const px = src.getImageData(0, 0, W, H).data;

    const negCtx = plate.neg.getContext('2d');
    const posCtx = plate.pos.getContext('2d');
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
    plate.baked = true;
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

  /** Start the ring that carries plate cur + 1 across, if it is ready. */
  beginSweep() {
    const k = this.cur + 1;
    if (this.plates.length < 2 || !this.plate(k).baked) return;
    const o = originOf(k);
    const ox = o.x * this.gw;
    const oy = o.y * this.gh;
    const rMax = Math.max(
      Math.hypot(ox, oy), Math.hypot(this.gw - ox, oy),
      Math.hypot(ox, this.gh - oy), Math.hypot(this.gw - ox, this.gh - oy),
    ) + (RING_W + FORCE_LAG) * this.gh;
    this.sweep = { start: this.simT, ox, oy, rMax };
  }

  endSweep() {
    this.cur += 1;
    this.sweep = null;
    this.swapped.fill(0);
    this.swapCount = 0;
  }

  tick() {
    const { gw, gh, heat, dev, tmp, swapped } = this;
    this.simT += DT;

    if (this.pointer) {
      const a = this.prev ?? this.pointer;
      this.stamp(a.x, a.y, this.pointer.x, this.pointer.y, BRUSH_HEAT * DT);
      this.prev = { ...this.pointer };
    }

    if (!this.sweep && this.simT >= this.nextCycle) {
      this.nextCycle += CYCLE;
      this.beginSweep();
    }

    // The ring: a band of heat at radius r from the origin, crossing the card.
    let r = -1;
    const sw = this.sweep;
    if (sw) {
      r = ((this.simT - sw.start) / SWEEP) * sw.rMax;
      const w = RING_W * gh;
      const inv = 1 / (w * w);
      const amt = RING_HEAT * DT;
      for (let y = 0; y < gh; y++) {
        const dy = y + 0.5 - sw.oy;
        for (let x = 0; x < gw; x++) {
          const e = Math.hypot(x + 0.5 - sw.ox, dy) - r;
          if (e > -2.5 * w && e < 2.5 * w) heat[y * gw + x] += amt * Math.exp(-e * e * inv);
        }
      }
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
    const lag = FORCE_LAG * gh;
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
        const nd = d + (target - d) * (target > d ? RISE : FALL);
        dev[i] = nd < 1e-4 ? 0 : nd;

        // The swap: once the ring has reached this cell, it changes plate as
        // its development reaches 0.5 — where it shows no image at all.
        if (sw && !swapped[i]) {
          const dist = Math.hypot(x + 0.5 - sw.ox, y + 0.5 - sw.oy);
          if (r >= dist && (nd >= 0.5 || r - dist > lag)) {
            swapped[i] = 1;
            this.swapCount++;
          }
        }
      }
    }
    if (sw && this.swapCount === swapped.length) this.endSweep();
  }

  /* ---------- the frame ---------- */

  /** Draw `src` over `dst` through a low-res alpha mask, upscaled soft. */
  over(dst, src, mask) {
    const t = this.T.getContext('2d');
    t.globalCompositeOperation = 'copy';
    t.imageSmoothingEnabled = true;
    t.imageSmoothingQuality = 'high';
    t.drawImage(mask, 0, 0, this.W, this.H);
    t.globalCompositeOperation = 'source-in';
    t.drawImage(src, 0, 0);
    t.globalCompositeOperation = 'source-over';
    dst.drawImage(this.T, 0, 0);
  }

  draw() {
    const { ctx, W, H } = this;
    const a = this.plate(this.cur);
    if (!a.baked) {
      ctx.fillStyle = `rgb(${NEG_DARK.join(',')})`;
      ctx.fillRect(0, 0, W, H);
      return;
    }

    const dev = this.dev;
    const dm = this.dData.data;
    let any = false;
    for (let i = 0; i < dev.length; i++) {
      if (dev[i] > 0) any = true;
      dm[i * 4 + 3] = dev[i] * 255;
    }

    // Mid-sweep, the negative and the positive on show are each a per-cell
    // choice between this plate and the next.
    let neg = a.neg;
    let pos = a.pos;
    if (this.sweep && this.swapCount > 0) {
      const b = this.plate(this.cur + 1);
      const sm = this.sData.data;
      const sw = this.swapped;
      for (let i = 0; i < sw.length; i++) sm[i * 4 + 3] = sw[i] * 255;
      this.sCtx.putImageData(this.sData, 0, 0);
      for (const [dst, from, to] of [[this.N, a.neg, b.neg], [this.P, a.pos, b.pos]]) {
        const c = dst.getContext('2d');
        c.globalCompositeOperation = 'copy';
        c.drawImage(from, 0, 0);
        c.globalCompositeOperation = 'source-over';
        this.over(c, to, this.sMask);
      }
      neg = this.N;
      pos = this.P;
    }

    ctx.globalCompositeOperation = 'copy';
    ctx.drawImage(neg, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    if (!any) return;

    // Positive over negative with d as alpha: the linear blend, done by the
    // compositor. The mask is upscaled with smoothing, which is the softness.
    this.dCtx.putImageData(this.dData, 0, 0);
    this.over(ctx, pos, this.dMask);
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

  /** Reduced motion: the first photograph, fully developed, held. */
  renderStill() {
    this.dev.fill(1);
    this.draw();
  }

  /** Advance by simulation: used by probes, not by the page. */
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
