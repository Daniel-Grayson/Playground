import { deviceRatio } from '../dpr';

import {
  CRAWL, CYCLE_TICKS, FONT_STACK, FONT_WEIGHT, FPS, MAX_ANGLE, MAX_CAP,
  PHASE_SPREAD, RULE_GAP, RULE_WIDTH, SPACING_SPREAD, TARGET_WIDTH, TILT_MAX,
  TILT_TAIL, WORLDS, divergenceAt,
} from './params';

const REF = 600;
const RAD = Math.PI / 180;

/** Heavy-tailed: nearly every glyph sits on the shared angle, one does not. */
function tiltDraw() {
  const sign = Math.random() < 0.5 ? -1 : 1;
  return sign * TILT_MAX * Math.pow(Math.random(), TILT_TAIL);
}

export class MoireType {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ok = !!this.ctx;
    this.raf = 0;
    this.running = false;
    this.acc = 0;
    this.last = 0;
    this.drawnTick = -1;
    this.W = 0;
    this.H = 0;
    this.dpr = 1;

    this.worldIndex = Math.floor(Math.random() * WORLDS.length);
    this.world = WORLDS[this.worldIndex];
    this.glyphs = [];

    // One reusable offscreen for the inner ruling, and one static mask.
    this.inner = document.createElement('canvas');
    this.innerCtx = this.inner.getContext('2d');
    this.mask = document.createElement('canvas');
    this.maskCtx = this.mask.getContext('2d');

    if (this.ok) this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    this.dpr = deviceRatio();
    this.W = r.width;
    this.H = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    for (const c of [this.inner, this.mask]) {
      c.width = this.canvas.width;
      c.height = this.canvas.height;
    }
    this.layout();
    this.drawnTick = -1;
    if (!this.running) this.draw(this.stillTick());
  }

  /** Build the word's mask once. It never changes until the word does. */
  layout() {
    const ctx = this.maskCtx;
    if (!ctx || !this.W) return;
    const word = this.world.word;
    const k = this.H / REF;
    const scale = this.dpr * k;

    // Two constraints, take the smaller: width target for long words, cap
    // ceiling for short ones, so a four-letter and a seven-letter word read
    // as the same piece.
    const PROBE = 100;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = `${FONT_WEIGHT} ${PROBE}px ${FONT_STACK}`;
    const m0 = ctx.measureText(word);
    const wide = m0.actualBoundingBoxLeft + m0.actualBoundingBoxRight;
    const capProbe = m0.actualBoundingBoxAscent || PROBE * 0.7;

    let px = (REF * TARGET_WIDTH * PROBE) / wide;
    if ((capProbe * px) / PROBE > REF * MAX_CAP) {
      px = (REF * MAX_CAP * PROBE) / capProbe;
    }

    ctx.setTransform(scale, 0, 0, scale, this.dpr * ((this.W - this.H) / 2), 0);
    ctx.clearRect(0, 0, REF, REF);
    ctx.font = `${FONT_WEIGHT} ${px}px ${FONT_STACK}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';

    const m = ctx.measureText(word);
    const total = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const cap = m.actualBoundingBoxAscent;
    let pen = (REF - total) / 2;
    const base = REF / 2 + cap / 2;

    // Each glyph keeps its own box and its own tilt. The box is what the
    // inner ruling is clipped to before the whole layer is masked by the
    // letterforms, which is how per-glyph angles cost one composite, not one
    // per letter.
    const glyphs = [];
    for (const ch of word) {
      const gm = ctx.measureText(ch);
      const w = gm.width;
      ctx.fillText(ch, pen, base);
      glyphs.push({
        x: pen - RULE_GAP,
        y: base - cap - RULE_GAP,
        w: w + RULE_GAP * 2,
        h: cap + RULE_GAP * 2 + px * 0.25,
        cx: pen + w / 2,
        cy: base - cap / 2,
        tilt: tiltDraw(),
      });
      pen += w;
    }
    this.glyphs = glyphs;
    // The ground is derived from the mask, so a new word invalidates it.
    // Keying the cache on the colour alone would go stale the moment two
    // worlds shared a ground.
    this._groundColor = null;
  }

  /** Fill a box with parallel lines at `deg`, offset by `phase` gaps. */
  rule(ctx, deg, gap, phase, cx, cy, reach) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(deg * RAD);
    ctx.lineWidth = RULE_WIDTH;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    const start = -reach + (((phase * gap) % gap) + gap) % gap;
    for (let y = start; y <= reach; y += gap) {
      ctx.moveTo(-reach, y);
      ctx.lineTo(reach, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.last = performance.now();
    const cycle = CYCLE_TICKS * WORLDS.length;
    const loop = (now) => {
      if (!this.running) return;
      // Clamped at zero: a rAF timestamp is the time the frame began and can
      // predate the performance.now() taken in start().
      this.acc += Math.max(0, Math.min(now - this.last, 250));
      this.last = now;
      const tick = Math.floor(this.acc / (1000 / FPS)) % cycle;
      if (tick !== this.drawnTick) this.draw(tick);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** The still frame is the parked word, not an empty field. */
  stillTick() {
    return Math.floor(CYCLE_TICKS * 0.5);
  }

  renderStill() {
    this.draw(this.stillTick());
  }

  destroy() {
    this.stop();
    this.ctx = null;
  }

  draw(tick) {
    const ctx = this.ctx;
    if (!ctx) return;
    this.drawnTick = tick;

    const wi = Math.floor(tick / CYCLE_TICKS) % WORLDS.length;
    const f = tick - Math.floor(tick / CYCLE_TICKS) * CYCLE_TICKS;
    if (wi !== this.worldIndex) {
      this.worldIndex = wi;
      this.world = WORLDS[wi];
      this.layout();
    }

    const d = divergenceAt(f);
    const k = this.H / REF;
    const scale = this.dpr * k;
    const ox = this.dpr * ((this.W - this.H) / 2);
    const reach = REF * 1.5;

    // Outer ruling, edge to edge.
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = this.world.bg;
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.setTransform(scale, 0, 0, scale, ox, 0);
    ctx.strokeStyle = this.world.rule;
    const outerPhase = tick * CRAWL * 0.06;
    this.rule(ctx, 0, RULE_GAP, outerPhase, REF / 2, REF / 2, reach);

    // At zero divergence the second ruling is the first ruling, so there is
    // nothing to lay over the field and no word on screen. This is the frame
    // the palette cuts on.
    if (d <= 0 || !this.glyphs.length) return;

    const innerGap = RULE_GAP * (1 + SPACING_SPREAD * d);
    const innerPhase = outerPhase + PHASE_SPREAD * d * Math.sin(tick * 0.11);
    const baseAngle = MAX_ANGLE * d;

    const ictx = this.innerCtx;
    ictx.setTransform(1, 0, 0, 1, 0, 0);
    ictx.clearRect(0, 0, this.inner.width, this.inner.height);
    ictx.setTransform(scale, 0, 0, scale, ox, 0);
    ictx.strokeStyle = this.world.rule;

    for (const g of this.glyphs) {
      ictx.save();
      ictx.beginPath();
      ictx.rect(g.x, g.y, g.w, g.h);
      ictx.clip();
      this.rule(ictx, baseAngle + g.tilt * d, innerGap, innerPhase, g.cx, g.cy, reach);
      ictx.restore();
    }

    // Mask the whole layer to the letterforms in one composite, then lay it
    // over the field. The glyph shape is a window onto a texture; it is never
    // itself drawn.
    ictx.setTransform(1, 0, 0, 1, 0, 0);
    ictx.globalCompositeOperation = 'destination-in';
    ictx.drawImage(this.mask, 0, 0);
    ictx.globalCompositeOperation = 'source-over';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // The ground is painted first inside the letterforms so the second
    // ruling replaces the first rather than overprinting it — two rulings
    // crossing would read as a plaid, not as one surface disagreeing.
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = this.world.bg;
    ctx.globalAlpha = 1;
    ctx.drawImage(this.maskGround(), 0, 0);
    ctx.restore();
    ctx.drawImage(this.inner, 0, 0);
  }

  /** The mask filled flat in the ground colour, to clear the outer ruling
   *  out of the letterforms before the inner one is laid in. */
  maskGround() {
    if (!this._ground || this._ground.width !== this.mask.width
        || this._groundColor !== this.world.bg) {
      const c = this._ground ?? document.createElement('canvas');
      c.width = this.mask.width;
      c.height = this.mask.height;
      const x = c.getContext('2d');
      x.clearRect(0, 0, c.width, c.height);
      x.drawImage(this.mask, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = this.world.bg;
      x.fillRect(0, 0, c.width, c.height);
      this._ground = c;
      this._groundColor = this.world.bg;
    }
    return this._ground;
  }
}
