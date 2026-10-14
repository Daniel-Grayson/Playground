import {
  BAR_PAD_BOTTOM, BAR_PAD_TOP, BAR_PAD_X, BAR_RADIUS, BAR_STROKE, CONDENSE_MIN,
  FIELD_SWAP, FONT_STACK, FONT_WEIGHT, HEADLINE, LINE_RIGHT_MARGIN, PARK_FRAMES,
  PARK_IN, PARK_OUT, PASS_END, PASS_OVERLAP, STAMP_TTL, STEP, TICK_MS, TRACKS,
  WORLDS,
} from './params';

const REF = 600;

const PARK_DELTA = PARK_FRAMES - (PARK_OUT - PARK_IN);
const PASS_FRAMES = PASS_END + PARK_DELTA;
const PASS_PITCH = PASS_FRAMES - PASS_OVERLAP;

/** Stretch the park without touching the authored breakpoints. */
function toTrack(f) {
  if (f <= PARK_IN) return f;
  if (f >= PARK_IN + PARK_FRAMES) return f - PARK_DELTA;
  return PARK_IN;
}

function posAt(track, f) {
  if (f < track[0][0] || f > track[track.length - 1][0]) return null;
  for (let i = 1; i < track.length; i++) {
    if (f <= track[i][0]) {
      const [f0, x0, y0] = track[i - 1];
      const [f1, x1, y1] = track[i];
      const t = f1 === f0 ? 0 : (f - f0) / (f1 - f0);
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    }
  }
  return null;
}

const PARKED_X = TRACKS.map((t) => posAt(t, PARK_IN)?.[0] ?? 0);

export class StampType {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ok = !!this.ctx;
    this.raf = 0;
    this.running = false;
    this.acc = 0;
    this.last = 0;
    this.drawnTick = -1;
    this.W = 0;
    this.H = 0;
    this.dpr = 1;
    this.family = FONT_STACK;
    this.metrics = new Map();
    this.worlds = opts.worlds?.length ? opts.worlds : WORLDS;
    this.lines = this.worlds.map((w) => w.lines.map((text, i) => ({ text, track: i })));
    if (this.ok) this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = r.width;
    this.H = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.drawnTick = -1;
    if (!this.running) this.draw(this.stillTick());
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.last = performance.now();
    const cycle = PASS_PITCH * this.worlds.length;
    const loop = (now) => {
      if (!this.running) return;
      // Clamp at zero as well as at 250. A rAF timestamp is the time the
      // frame BEGAN, which can predate the performance.now() captured in
      // start() by a fraction of a millisecond; that negative first delta
      // puts acc just below zero, and Math.floor of any small negative is
      // -1, so tick comes out -1 and worlds[-1] is undefined.
      this.acc += Math.max(0, Math.min(now - this.last, 250));
      this.last = now;
      const tick = Math.floor(this.acc / TICK_MS) % cycle;
      if (tick !== this.drawnTick) this.draw(tick);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  renderStill() {
    this.draw(this.stillTick());
  }

  destroy() {
    this.stop();
    this.ctx = null;
  }

  stillTick() {
    return PARK_IN + Math.floor(PARK_FRAMES / 2);
  }

  measure(ctx, text, size, room = Infinity) {
    const key = `${size}|${room}|${text}`;
    const got = this.metrics.get(key);
    if (got) return got;
    ctx.font = `${FONT_WEIGHT} ${size * REF}px ${this.family}`;
    const m = ctx.measureText(text);
    const raw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const sx = raw > room ? Math.max(CONDENSE_MIN, room / raw) : 1;
    const met = {
      dx: m.actualBoundingBoxLeft * sx,
      asc: m.actualBoundingBoxAscent,
      w: raw * sx,
      h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
      sx,
    };
    this.metrics.set(key, met);
    return met;
  }

  room(line) {
    return REF - PARKED_X[line.track] - LINE_RIGHT_MARGIN * REF;
  }

  lineMetrics(ctx, line) {
    return this.measure(ctx, line.text, HEADLINE, this.room(line));
  }

  place(line, f) {
    return posAt(TRACKS[line.track], toTrack(f));
  }

  text(ctx, str, size, x, y, m, stroke) {
    ctx.font = `${FONT_WEIGHT} ${size * REF}px ${this.family}`;
    if (m.sx === 1) {
      if (stroke) ctx.strokeText(str, x, y);
      ctx.fillText(str, x, y);
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(m.sx, 1);
    if (stroke) ctx.strokeText(str, 0, 0);
    ctx.fillText(str, 0, 0);
    ctx.restore();
  }

  /** The rounded bar UNIONED with the glyphs stroked fat in bar colour — the
   *  union is where the descender drips along a bar's bottom edge come from. */
  silhouette(ctx, line, x, y, color) {
    const m = this.lineMetrics(ctx, line);
    const padX = BAR_PAD_X * REF;
    const padT = BAR_PAD_TOP * REF;
    const padB = BAR_PAD_BOTTOM * REF;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - padX, y - padT, m.w + padX * 2, m.h + padT + padB, BAR_RADIUS * REF);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = BAR_STROKE * REF;
    ctx.lineJoin = 'round';
    this.text(ctx, line.text, HEADLINE, x + m.dx, y + m.asc, m, true);
  }

  /** Computed fresh from the tracks each frame: no accumulation state, so the
   *  loop seam, resizes and tab-resumes all land on exactly the right residue. */
  stamps(ctx, wi, f) {
    const world = this.worlds[wi];
    const lines = this.lines[wi];
    const step0 = Math.floor(f / STEP) * STEP;
    for (let s = step0; s > f - STAMP_TTL; s -= STEP) {
      if (s < STEP) break;
      for (const line of lines) {
        const a = this.place(line, s - STEP);
        const b = this.place(line, s);
        if (!a || !b) continue;
        if (Math.abs(a[0] - b[0]) < 1.5 && Math.abs(a[1] - b[1]) < 1.5) continue;
        this.silhouette(ctx, line, a[0], a[1], world.bar);
      }
    }
  }

  /** All four bars, THEN all four inks: rows sit 68px apart but a bar with a
   *  descender runs ~75px, so per-line bar-then-ink lets the next row's bar
   *  bite chunks out of the previous row's letterforms. */
  live(ctx, wi, f) {
    const world = this.worlds[wi];
    const placed = [];
    for (const line of this.lines[wi]) {
      const p = this.place(line, f);
      if (p) placed.push([line, p]);
    }
    for (const [line, p] of placed) this.silhouette(ctx, line, p[0], p[1], world.bar);
    ctx.fillStyle = world.ink;
    for (const [line, p] of placed) {
      const m = this.lineMetrics(ctx, line);
      this.text(ctx, line.text, HEADLINE, p[0] + m.dx, p[1] + m.asc, m, false);
    }
  }

  draw(tick) {
    const ctx = this.ctx;
    if (!ctx) return;
    this.drawnTick = tick;
    const { W, H } = this;
    const k = H / REF;              // square 600-space, letterboxed
    const ox = (W - H) / 2;
    const n = this.worlds.length;

    const wi = Math.floor(tick / PASS_PITCH) % n;
    const f = tick - Math.floor(tick / PASS_PITCH) * PASS_PITCH;
    const prev = (wi - 1 + n) % n;
    const prevF = f + PASS_PITCH;
    const overlapping = prevF <= PASS_FRAMES;

    // Hard cut, never a fade: a gradient on the field is the one thing that
    // would give away it is not print.
    const fieldWorld = f < FIELD_SWAP && overlapping ? prev : wi;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = this.worlds[fieldWorld].bg;
    ctx.fillRect(0, 0, W, H);

    ctx.setTransform(this.dpr * k, 0, 0, this.dpr * k, this.dpr * ox, 0);

    if (overlapping) this.stamps(ctx, prev, prevF);
    this.stamps(ctx, wi, f);
    if (overlapping) this.live(ctx, prev, prevF);
    this.live(ctx, wi, f);
  }
}
