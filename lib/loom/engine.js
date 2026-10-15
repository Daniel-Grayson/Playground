import {
  CELL_FRAC, CELL_MIN, CELL_MAX, SATIN, warpOver, PHASES, CYCLE_SEC, BLEND_SEC, BLEND_STEPS,
  SHEEN_SEC, WIND_MS, SCENES, phaseAt,
} from './params';

const FONT =
  "'PP Mori', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function rgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(a, b, q) {
  if (q <= 0) return a;
  if (q >= 1) return b;
  const x = rgb(a);
  const y = rgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * q));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export class LoomDamask {
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
    this.tiles = new Map();
    this.wind = 0;
    this.windTo = 0;
    this.px = 0;
    this.py = 0;

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
    // Whole device px per thread, so the satin tile is pixel exact, with a
    // floor in DEVICE pixels rather than CSS ones. A thread is inset a pixel
    // each side to leave the weave its gaps, so at four device px there is
    // only two px of thread left and the shading gradients average the whole
    // cloth to mud — which is what happens on a 1x display, not a 2x one.
    const cell = Math.min(CELL_MAX, Math.max(CELL_MIN, this.ch * CELL_FRAC));
    this.c = Math.max(7, Math.round(cell * this.dpr));
    this.tiles.clear();
    this.fitWord = null;
  }

  /**
   * One satin repeat as a CanvasPattern. Weft threads are laid continuously
   * and warp threads drawn over them only where they float, so a run of warp
   * crossings in a column merges into one unbroken thread — the float is the
   * whole point and breaking it into dashes kills the tone difference.
   */
  tile(f, warp, weft) {
    const key = `${f}|${warp}|${weft}`;
    const hit = this.tiles.get(key);
    if (hit) return hit;

    const c = this.c;
    const size = c * SATIN;
    const cv = document.createElement('canvas');
    cv.width = size;
    cv.height = size;
    const g = cv.getContext('2d');

    // weft: continuous horizontal threads, inset top and bottom only
    for (let j = 0; j < SATIN; j++) {
      const y = j * c;
      g.fillStyle = weft;
      g.fillRect(0, y + 1, size, c - 2);
      const sh = g.createLinearGradient(0, y, 0, y + c);
      sh.addColorStop(0, 'rgba(0,0,0,0.34)');
      sh.addColorStop(0.45, 'rgba(255,255,255,0.16)');
      sh.addColorStop(1, 'rgba(0,0,0,0.34)');
      g.fillStyle = sh;
      g.fillRect(0, y + 1, size, c - 2);
    }

    // warp: vertical, inset left and right only, drawn where it floats over
    for (let i = 0; i < SATIN; i++) {
      const x = i * c;
      const sh = g.createLinearGradient(x, 0, x + c, 0);
      sh.addColorStop(0, 'rgba(0,0,0,0.34)');
      sh.addColorStop(0.45, 'rgba(255,255,255,0.18)');
      sh.addColorStop(1, 'rgba(0,0,0,0.34)');
      for (let j = 0; j < SATIN; j++) {
        if (!warpOver(i, j, f)) continue;
        const y = j * c;
        g.fillStyle = warp;
        g.fillRect(x + 1, y, c - 2, c);
        g.fillStyle = sh;
        g.fillRect(x + 1, y, c - 2, c);
      }
    }

    const pat = this.ctx.createPattern(cv, 'repeat');
    this.tiles.set(key, pat);
    if (this.tiles.size > 48) {
      // Crossfade tiles are transient; keep the map from growing forever.
      const first = this.tiles.keys().next().value;
      if (first !== key) this.tiles.delete(first);
    }
    return pat;
  }

  wordFont(word) {
    const ctx = this.ctx;
    if (this.fitWord && this.fitWord.word === word) return this.fitWord.font;
    let size = this.H * 0.78;
    for (let i = 0; i < 24; i++) {
      ctx.font = `800 ${size}px ${FONT}`;
      if (ctx.measureText(word).width <= this.W * 0.76) break;
      size *= 0.94;
    }
    const font = `800 ${size}px ${FONT}`;
    this.fitWord = { word, font };
    return font;
  }

  drawAt(t) {
    const ctx = this.ctx;
    if (!ctx) return;
    const { W, H } = this;
    const { i: pi, u, phase, scene } = phaseAt(t);

    const cur = SCENES[scene];
    const prev = SCENES[(scene - 1 + SCENES.length) % SCENES.length];
    // The dye change runs only inside the blank, quantised so its tiles cache.
    let warp = cur.warp;
    let weft = cur.weft;
    if (pi === 0) {
      const raw = Math.min(1, u / BLEND_SEC);
      const q = Math.round(raw * BLEND_STEPS) / BLEND_STEPS;
      warp = mixHex(prev.warp, cur.warp, q);
      weft = mixHex(prev.weft, cur.weft, q);
    }

    // Both patterns share one phase, so the thread grid runs straight through
    // the motif boundary instead of jumping at it.
    const outPat = this.tile(phase.out, warp, weft);
    const inPat = this.tile(phase.in, warp, weft);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = outPat;
    ctx.fillRect(0, 0, W, H);

    // The motif is the same cloth at a different float length. Filling the
    // glyphs with a pattern means no mask, no layer and no extra full-card
    // composite — the letterform is just a shape the other weave fills.
    ctx.fillStyle = inPat;
    ctx.font = this.wordFont(cur.word);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cur.word, W / 2, H * 0.53);

    // Raking light. A loom is discrete and the weave steps; the light is the
    // only thing in the piece that moves continuously.
    const sp = ((t % SHEEN_SEC) / SHEEN_SEC) * 1.6 - 0.3;
    const g = ctx.createLinearGradient(0, H, W, 0);
    const at = (v) => Math.min(1, Math.max(0, v));
    g.addColorStop(0, 'rgba(0,0,0,0.16)');
    g.addColorStop(at(sp - 0.22), 'rgba(0,0,0,0.04)');
    g.addColorStop(at(sp), 'rgba(255,245,220,0.15)');
    g.addColorStop(at(sp + 0.22), 'rgba(0,0,0,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (this.wind > 0.004) {
      const r = Math.max(W, H) * 0.34;
      const rg = ctx.createRadialGradient(this.px, this.py, 0, this.px, this.py, r);
      rg.addColorStop(0, `rgba(255,248,230,${(0.20 * this.wind).toFixed(3)})`);
      rg.addColorStop(1, 'rgba(255,248,230,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }
  }

  setPointer(xCss, yCss) {
    this.px = xCss * this.dpr;
    this.py = yCss * this.dpr;
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
    // Parked on the full-contrast hold.
    this.elapsed = PHASES[0].secs + PHASES[1].secs + PHASES[2].secs + 1.0;
    this.drawAt(this.elapsed);
  }

  destroy() {
    this.stop();
    this.tiles.clear();
    this.ctx = null;
    this.ok = false;
  }
}
