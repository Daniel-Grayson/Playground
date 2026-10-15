import {
  SLAT_PX, MIN_SLATS, LIGHT_DEG, LIGHT_GAIN,
  CYCLE_SEC, WIND_DEG, WIND_MS, SCENES, sceneOf, turnAt,
} from './params';

const FONT =
  "'PP Mori', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const RAD = Math.PI / 180;

export class SlatTurn {
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
    this.wind = 0;        // eased pointer nudge, -1..1
    this.windTo = 0;
    this.posters = [];

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
    this.n = Math.max(MIN_SLATS, Math.round(this.cw / SLAT_PX));
    this.posters = [];
  }

  /** One poster per face, rendered at full card size and sampled by column. */
  poster(i) {
    if (this.posters[i]) return this.posters[i];
    const s = SCENES[i];
    const c = document.createElement('canvas');
    c.width = this.W;
    c.height = this.H;
    const x = c.getContext('2d');
    x.fillStyle = s.bg;
    x.fillRect(0, 0, this.W, this.H);
    x.fillStyle = s.ink;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = this.H * 0.72;
    for (let k = 0; k < 24; k++) {
      x.font = `800 ${size}px ${FONT}`;
      if (x.letterSpacing !== undefined) x.letterSpacing = `${size * 0.02}px`;
      if (x.measureText(s.word).width <= this.W * 0.82) break;
      size *= 0.94;
    }
    x.font = `800 ${size}px ${FONT}`;
    if (x.letterSpacing !== undefined) x.letterSpacing = `${size * 0.02}px`;
    x.fillText(s.word, this.W / 2, this.H * 0.52);
    this.posters[i] = c;
    return c;
  }

  drawAt(t) {
    const ctx = this.ctx;
    if (!ctx) return;
    const { W, H, n } = this;
    const theta = turnAt(t) + this.wind * WIND_DEG;
    const slat = W / n;

    // Which faces are facing us, in left-to-right order, with their shares.
    const faces = [];
    let tot = 0;
    for (let k = 0; k < 3; k++) {
      const phi = (theta + k * 120) * RAD;
      const c = Math.cos(phi);
      if (c <= 1e-4) continue;
      faces.push({ k, c, s: Math.sin(phi), phi });
      tot += c;
    }
    faces.sort((a, b) => a.s - b.s);
    const lightRef = Math.cos(LIGHT_DEG * RAD);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;

    for (let i = 0; i < n; i++) {
      const x0 = i * slat;
      let x = x0;
      for (let f = 0; f < faces.length; f++) {
        const face = faces[f];
        const w = (slat * face.c) / tot;
        if (w <= 0.5) { x += w; continue; }

        // The face shows this slat's own column of its poster, squeezed. That
        // is what keeps type in place as a face narrows instead of sliding.
        ctx.drawImage(
          this.poster(sceneOf(face.k)),
          x0, 0, slat, H,
          x, 0, w, H,
        );

        // Lambert, darken only, zeroed at the face-on angle. At theta = 60 the
        // left face sits square to the light and takes nothing while the right
        // face takes almost half — which is the whole reason the row reads as
        // solid prisms rather than printed stripes.
        const dark = Math.max(0, lightRef - Math.cos(face.phi - LIGHT_DEG * RAD)) * LIGHT_GAIN;
        if (dark > 0.003) {
          ctx.fillStyle = `rgba(0,0,0,${Math.min(0.66, dark).toFixed(3)})`;
          ctx.fillRect(x, 0, w, H);
        }

        // The crease between two faces of the same prism.
        if (f > 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(x - 0.75 * this.dpr, 0, 1.5 * this.dpr, H);
        }
        x += w;
      }
      // The outer edge where one prism meets the next.
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(x0, 0, Math.max(1, 0.8 * this.dpr), H);
    }
  }

  setPointer(xCss) {
    this.windTo = Math.max(-1, Math.min(1, (xCss / Math.max(1, this.cw)) * 2 - 1));
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
    // Mid-turn, so the still shows the mechanism rather than one flat poster.
    this.elapsed = CYCLE_SEC * 0.17;
    this.drawAt(this.elapsed);
  }

  destroy() {
    this.stop();
    this.posters = [];
    this.ctx = null;
    this.ok = false;
  }
}
