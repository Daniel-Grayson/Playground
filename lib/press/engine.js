import {
  PHASES, CYCLE_SEC, REF_W, PLATES, WIND_PX, WIND_MS, SCENES, pressAt, sceneAt,
} from './params';

const RAD = Math.PI / 180;

export class PressRegister {
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
    this.lastWall = 0;
    this.plates = [];
    this.wind = 0;
    this.windTo = 0;
    this.wx = 0;
    this.wy = 0;

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
    // Amplitudes are authored against a reference width so a narrow card
    // misregisters by the same fraction of itself, not by the same pixels.
    this.k = (this.cw / REF_W) * this.dpr;
    this.plates = [];
  }

  /** One plate: its marks in one ink on bare white, plus its own crosses. */
  plate(sceneIdx, k) {
    const key = `${sceneIdx}:${k}`;
    if (this.plates[key]) return this.plates[key];
    const sc = SCENES[sceneIdx];
    const ink = sc.inks[k];
    const { W, H } = this;

    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const g = cv.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);
    g.fillStyle = ink;
    g.strokeStyle = ink;
    g.lineCap = 'butt';

    for (const s of sc.art[k]) {
      const [kind] = s;
      if (kind === 'circle') {
        g.beginPath();
        g.arc(s[1] * W, s[2] * H, s[3] * H, 0, Math.PI * 2);
        g.fill();
      } else if (kind === 'rect') {
        g.fillRect(s[1] * W, s[2] * H, s[3] * W, s[4] * H);
      } else if (kind === 'ring') {
        g.lineWidth = s[4] * H;
        g.beginPath();
        g.arc(s[1] * W, s[2] * H, s[3] * H, 0, Math.PI * 2);
        g.stroke();
      } else if (kind === 'tri') {
        g.beginPath();
        g.moveTo(s[1] * W, s[2] * H);
        g.lineTo(s[3] * W, s[4] * H);
        g.lineTo(s[5] * W, s[6] * H);
        g.closePath();
        g.fill();
      } else if (kind === 'frame') {
        g.lineWidth = s[5] * H;
        g.strokeRect(s[1] * W, s[2] * H, s[3] * W, s[4] * H);
      } else if (kind === 'rules') {
        const [, x, y, w, n, gap, lw] = s;
        g.lineWidth = lw * H;
        for (let i = 0; i < n; i++) {
          const yy = (y + i * gap) * H;
          g.beginPath();
          g.moveTo(x * W, yy);
          g.lineTo((x + w) * W, yy);
          g.stroke();
        }
      }
    }

    // Registration crosses. Four per plate, in the same place on every plate,
    // so they only resolve into one mark when the press is true.
    const m = 0.062 * H;
    const r = 0.038 * H;
    g.lineWidth = Math.max(1.5, 0.0055 * H);
    for (const [cx, cy] of [[m, m], [W - m, m], [m, H - m], [W - m, H - m]]) {
      g.beginPath();
      g.moveTo(cx - r, cy);
      g.lineTo(cx + r, cy);
      g.moveTo(cx, cy - r);
      g.lineTo(cx, cy + r);
      g.stroke();
      g.beginPath();
      g.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
      g.stroke();
    }

    this.plates[key] = cv;
    return cv;
  }

  drawAt(t) {
    const ctx = this.ctx;
    if (!ctx) return;
    const { W, H } = this;
    const { drift } = pressAt(t);
    const idx = sceneAt(t);
    const sc = SCENES[idx];

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = sc.paper;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'multiply';
    for (let k = 0; k < PLATES.length; k++) {
      const p = PLATES[k];
      const a = p.deg * RAD;
      // The shimmy only exists while the press is out: at drift 0 every plate
      // is exactly home, so the in-register state is dead still and exact.
      const wob = drift * p.wob * Math.sin(t * p.freq + k * 1.7);
      const dx = (drift * p.amp * Math.cos(a) + wob) * this.k + this.wind * this.wx * (0.6 + k * 0.22);
      const dy = (drift * p.amp * Math.sin(a) - wob * 0.6) * this.k + this.wind * this.wy * (0.6 + k * 0.22);
      const rot = (drift * p.rot + this.wind * this.wx * 0.012) * RAD;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(W / 2 + dx, H / 2 + dy);
      ctx.rotate(rot);
      ctx.drawImage(this.plate(idx, k), -W / 2, -H / 2);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  setPointer(xCss, yCss) {
    this.wx = ((xCss / Math.max(1, this.cw)) * 2 - 1) * WIND_PX * this.dpr;
    this.wy = ((yCss / Math.max(1, this.ch)) * 2 - 1) * WIND_PX * this.dpr;
    this.windTo = 1;
  }

  clearPointer() {
    this.windTo = 0;
  }

  now() {
    return this.running ? performance.now() / 1000 - this.base : this.elapsed;
  }

  tick = () => {
    if (!this.running) return;
    const wall = performance.now() / 1000;
    const dt = this.lastWall ? Math.min(0.1, wall - this.lastWall) : 0;
    this.lastWall = wall;
    this.wind += (this.windTo - this.wind) * (1 - Math.exp(-(dt * 1000) / WIND_MS));
    this.drawAt(this.now());
    this.raf = requestAnimationFrame(this.tick);
  };

  start() {
    if (!this.ok || this.running) return;
    this.running = true;
    this.base = performance.now() / 1000 - this.elapsed;
    this.lastWall = 0;
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
    this.elapsed = PHASES[0].secs * 0.5;   // in register
    this.drawAt(this.elapsed);
  }

  destroy() {
    this.stop();
    this.plates = [];
    this.ctx = null;
    this.ok = false;
  }
}
