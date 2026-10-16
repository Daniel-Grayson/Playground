import {
  CYCLE_TICKS, DEPTH_AT_REST, DEPTH_SPREAD, EDGE_CULL, ENTER_RISE,
  ENTER_STAGGER, ENTER_TABLE, ENTER_TICKS, ENTER_TURN, ESCAPE_SPIN_MAX,
  ESCAPE_START, ESCAPE_TICKS, FALL_SPREAD, FALL_TABLE, FLOOD_SQUEEZE,
  FOCUS_DRIFT, FONT_STACK, FONT_WEIGHT, FPS, HOLD_STRETCH, HOLD_TICKS,
  LEAD_PIVOT, LEAD_REST, LEAD_START, LEAD_TABLE, LEAD_TICKS, MAX_CAP,
  MAX_CAP_SOLO, PEAK_SCALE, PITCH_OVER_CAP, PRESETS, PULL, PULL_EASE, ROT_TABLE,
  SCALE_TABLE, SMEAR_MIN_SPEED, SMEAR_REACH, SMEAR_STEPS, SPIN_MAX, SPIN_TAIL,
  TARGET_WIDTH, TARGET_WIDTH_SOLO, TRACK_REST, TRACK_ZOOM, TUMBLE_MAX, TURN_LAG,
  ZOOM_START, ZOOM_TICKS, sample,
} from './params';

/** Heavy-tailed draw: median low, long tail, mixed sign. */
function spinDraw(max, tail, spread) {
  const u = Math.random();
  const sign = Math.random() < 0.5 ? -1 : 1;
  return sign * max * spread * Math.pow(u, tail);
}

/**
 * Tracking has to be added to the measured width BEFORE the size is solved,
 * or every lockup lands narrower than its target by the sum of its gaps.
 * n glyphs have n-1 gaps.
 */
function lineWidth(ctx, line, track) {
  const glyphs = [...line];
  if (!glyphs.length) return 0;
  return ctx.measureText(line).width + track * (glyphs.length - 1);
}

export class Leader {
  constructor(canvas) {
    this.ok = false;
    this.canvas = canvas;
    this.ctx = null;
    this.family = FONT_STACK;
    this.raf = 0;
    this.running = false;

    this.tick = 0;
    this.last = 0;
    this.dTick = 1;

    this.presetIndex = 0;
    this.preset = PRESETS[this.presetIndex];
    this.glyphs = [];

    this.half = 0;
    this.c1 = 0;
    this.c2 = 0;
    this.fontPx = 0;
    this.focus = 1;

    this.pxTarget = 0;
    this.pyTarget = 0;
    this.pxNow = 0;
    this.pyNow = 0;
    this.pointerIn = false;
    this.waited = 0;

    this.w = 0;
    this.h = 0;
    this.frame = [];

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    this.ctx = ctx;
    this.ok = true;
    this.resize();
  }

  setPointer(x, y) {
    this.pxTarget = Math.max(-1, Math.min(1, x));
    this.pyTarget = Math.max(-1, Math.min(1, y));
    this.pointerIn = true;
  }

  clearPointer() {
    this.pointerIn = false;
    this.pxTarget = 0;
    this.pyTarget = 0;
  }

  resize() {
    const ctx = this.ctx;
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.layout();
    if (!this.running) this.draw();
  }

  layout() {
    const ctx = this.ctx;
    if (!ctx || !this.w) return;
    const text = this.preset.lines;
    // A head card is a two-line lockup; a numeral in the count is one glyph
    // that has to fill the frame. Same ramps, different setting.
    const solo = text.length === 1;

    // Two constraints, take the smaller: the width target catches long
    // lockups, the cap ceiling catches short ones.
    const PROBE = 100;
    ctx.font = `${FONT_WEIGHT} ${PROBE}px ${this.family}`;
    const capProbe = ctx.measureText('H').actualBoundingBoxAscent || PROBE * 0.7;

    const probeTrack = TRACK_REST * PROBE;
    const wide = Math.max(...text.map((l) => lineWidth(ctx, l, probeTrack)));

    const capCeil = solo ? MAX_CAP_SOLO : MAX_CAP;
    let px = (this.w * (solo ? TARGET_WIDTH_SOLO : TARGET_WIDTH) * PROBE) / wide;
    const capAt = (s) => (capProbe * s) / PROBE;
    if (capAt(px) > this.h * capCeil) px = (this.h * capCeil * PROBE) / capProbe;
    this.fontPx = px;

    ctx.font = `${FONT_WEIGHT} ${px}px ${this.family}`;
    const cap = capAt(px);
    const pitch = cap * PITCH_OVER_CAP;

    // Centre on the real ink of the words: a generic ascender-descender box
    // reserves descender space a line without one never uses, and the lockup
    // then rides high in the frame.
    const base = solo ? [0] : [-pitch / 2, pitch / 2];
    const m = text.map((l) => ctx.measureText(l));
    const last = text.length - 1;
    const top = base[0] - m[0].actualBoundingBoxAscent;
    const bot = base[last] + m[last].actualBoundingBoxDescent;
    const mid = (top + bot) / 2;
    this.half = (bot - top) / 2;

    const centreOf = (i) =>
      base[i] + (m[i].actualBoundingBoxDescent - m[i].actualBoundingBoxAscent) / 2 - mid;
    this.c1 = centreOf(0);
    this.c2 = centreOf(last);

    const spread = this.preset.spin;
    const glyphs = [];
    const lines = text.map((l, i) => [l, base[i], i]);
    const track = TRACK_REST * px;

    for (const [line, baseline, li] of lines) {
      const total = lineWidth(ctx, line, track);
      let pen = -total / 2;
      for (const ch of line) {
        const gm = ctx.measureText(ch);
        // Pivot on the ink box, not the advance box: a letter turned about
        // its advance centre visibly swims sideways as it spins.
        const left = -gm.actualBoundingBoxLeft;
        const right = gm.actualBoundingBoxRight;
        const asc = gm.actualBoundingBoxAscent;
        const dsc = gm.actualBoundingBoxDescent;
        if (ch !== ' ') {
          glyphs.push({
            ch,
            x: pen,
            y: baseline - mid,
            px: (left + right) / 2,
            py: (dsc - asc) / 2,
            line: li,
            settle: spinDraw(SPIN_MAX, SPIN_TAIL, spread),
            escape: spinDraw(ESCAPE_SPIN_MAX, SPIN_TAIL, spread),
            tumble: spinDraw(TUMBLE_MAX, SPIN_TAIL, spread),
            depth: Math.random() * 2 - 1,
            lx: NaN,
            ly: NaN,
            turnIn: (Math.random() < 0.5 ? -1 : 1) * ENTER_TURN,
            delay: 0,
            spread: 0,
          });
        }
        pen += gm.width + track;
      }
    }

    // Ordered by distance from centre, not by index: outermost letters land
    // first and the word closes on its own middle. Left-to-right reads as a
    // wave, which fights a piece organised around a centre.
    let maxDist = 0;
    for (const g of glyphs) maxDist = Math.max(maxDist, Math.abs(g.x + g.px));
    for (const g of glyphs) {
      const d = maxDist > 0 ? Math.abs(g.x + g.px) / maxDist : 0;
      g.delay = (1 - d) * ENTER_STAGGER;
      g.spread = maxDist > 0 ? (g.x + g.px) / maxDist : 0;
    }

    this.glyphs = glyphs;
    // Preallocated slots: the draw order is very nearly sorted frame to
    // frame, so insertion sort over these beats allocating a slice.
    this.frame = glyphs.map(() => ({
      g: glyphs[0], gx: 0, gy: 0, deg: 0, face: 1, sc: 1, vx: 0, vy: 0,
    }));
  }

  nextPreset() {
    // In order, and wrapping: a countdown that picks its next number at
    // random is not a countdown. The head card comes round again with the
    // wrap, which is where a reel is spliced to the next one anyway.
    this.presetIndex = (this.presetIndex + 1) % PRESETS.length;
    this.preset = PRESETS[this.presetIndex];
    this.focus = Math.random() < 0.5 ? -1 : 1;
    this.layout();
  }

  start() {
    if (!this.ok || this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      // Clamped at zero: the first rAF timestamp can predate start()'s
      // performance.now(), and a negative dt would step the tick backwards.
      const dt = Math.max(0, Math.min((now - this.last) / 1000, 0.1));
      this.last = now;
      this.dTick = dt * FPS;

      const k = 1 - Math.exp(-dt / PULL_EASE);
      this.pxNow += (this.pxTarget - this.pxNow) * k;
      this.pyNow += (this.pyTarget - this.pyNow) * k;

      // Both bounds. A gate of merely "past the hold" stays true for the rest
      // of the cycle, so a pointer arriving mid-flood would freeze the type
      // at whatever scale it had reached.
      const holdEnd = ENTER_TICKS + ENTER_STAGGER + HOLD_TICKS - 1;
      const atHold = this.tick >= holdEnd && this.tick < ZOOM_START;
      if (this.pointerIn && atHold && this.waited < HOLD_STRETCH) {
        this.waited += this.dTick;
      } else {
        this.tick += this.dTick;
      }

      if (this.tick >= CYCLE_TICKS) {
        this.tick -= CYCLE_TICKS;
        this.waited = 0;
        this.nextPreset();
      }
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** The still frame is the settled lockup, not frame zero (an empty card). */
  renderStill() {
    this.tick = ENTER_TICKS + ENTER_STAGGER + HOLD_TICKS / 2;
    // Clear remembered positions, or the first frame measures a velocity
    // against wherever the letters used to be and smears a still picture.
    for (const g of this.glyphs) { g.lx = NaN; g.ly = NaN; }
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx || !this.glyphs.length) return;
    const t = this.tick;

    ctx.fillStyle = this.preset.bg;
    ctx.fillRect(0, 0, this.w, this.h);

    const zoomU = (t - ZOOM_START) / ZOOM_TICKS;
    const zoom = sample(SCALE_TABLE, zoomU);
    const rot = sample(ROT_TABLE, zoomU);
    const scale = 1 + (PEAK_SCALE - 1) * zoom;

    const lu = (t - LEAD_START) / LEAD_TICKS;
    const lead = lu >= 1 ? LEAD_REST : sample(LEAD_TABLE, lu);

    // Fall distance off the NEAREST letter's scale, or the closest letters
    // are still in frame when the next word starts arriving.
    const reach = this.h / 2 + this.half * scale * (1 + DEPTH_SPREAD);
    const drop = sample(FALL_TABLE, (t - ESCAPE_START) / ESCAPE_TICKS);
    const fall = drop * reach;

    const cx = this.w / 2;
    const cy = this.h / 2;

    const trackNow = TRACK_REST + (TRACK_ZOOM - TRACK_REST) * zoom;
    const trackDelta = (trackNow - TRACK_REST) * this.fontPx;
    const squeeze = 1 + FLOOD_SQUEEZE * zoom;

    const focusX = this.focus * FOCUS_DRIFT * this.w * zoom;

    // The lean must fade to zero as the zoom takes over, or it carries the
    // word off centre exactly when it should be arriving dead centre.
    const leanAmt = (1 - zoom) * PULL;
    const leanX = this.pxNow * leanAmt * this.w;
    const leanY = this.pyNow * leanAmt * this.h;

    const centreMid = (this.c1 + this.c2) / 2;
    const pivot = centreMid + LEAD_PIVOT * (this.c2 - centreMid);
    const open = lead - 1;
    const shift = [(this.c1 - pivot) * open, (this.c2 - pivot) * open];

    ctx.fillStyle = this.preset.ink;
    ctx.font = `${FONT_WEIGHT} ${this.fontPx}px ${this.family}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const draws = this.frame;
    let n = 0;

    for (const g of this.glyphs) {
      const eu = (t - g.delay) / ENTER_TICKS;
      const arrive = sample(ENTER_TABLE, eu);

      const turned = Math.pow(Math.max(arrive, 0), TURN_LAG);
      const yaw = g.turnIn * (1 - turned) + g.tumble * drop;
      // One cosine is the entire 3D model. Keep the sign: a negative cosine
      // is a letter turned past 90 degrees, correctly mirrored.
      const face = Math.cos((yaw * Math.PI) / 180);
      if (Math.abs(face) < EDGE_CULL) continue;

      const ly = g.y + shift[g.line];
      const dx = g.spread * (trackDelta * 4 + FALL_SPREAD * drop * this.w);

      // Depth scales the letter's SIZE only. Scaling its POSITION by its own
      // depth destroys the symmetry of the glyph offsets, and the word's ink
      // centre then drifts off centre as the depth opens through the zoom.
      const depthNow = DEPTH_AT_REST + (1 - DEPTH_AT_REST) * zoom;
      const sc = scale * (1 + g.depth * DEPTH_SPREAD * depthNow);

      const par = 1 + g.depth * 0.6;
      const gx = cx + (g.x + g.px) * scale * squeeze + dx + focusX + leanX * par;

      const rise = (1 - arrive) * ENTER_RISE * this.half * scale;
      const gy = cy + (ly + g.py) * scale + fall - rise + leanY * par;

      const deg = g.settle * rot + g.escape * drop;

      // Velocity measured as the actual drawn delta, so the smear covers
      // every source of motion without any of them knowing it exists.
      const vx = Number.isNaN(g.lx) ? 0 : gx - g.lx;
      const vy = Number.isNaN(g.ly) ? 0 : gy - g.ly;
      g.lx = gx;
      g.ly = gy;

      const slot = draws[n++];
      slot.g = g;
      slot.gx = gx;
      slot.gy = gy;
      slot.deg = deg;
      slot.face = face;
      slot.sc = sc;
      slot.vx = vx;
      slot.vy = vy;
    }

    // Back to front, so nearer letters paint over further ones.
    for (let i = 1; i < n; i++) {
      const s0 = draws[i];
      const k = s0.sc + Math.abs(s0.face) * 0.001;
      let j = i - 1;
      while (j >= 0 && draws[j].sc + Math.abs(draws[j].face) * 0.001 > k) {
        draws[j + 1] = draws[j];
        j--;
      }
      draws[j + 1] = s0;
    }

    // Convert the threshold using each frame's own duration, or it fires on
    // a 30Hz display and never on a 120Hz one.
    const perTick = this.dTick > 1e-4 ? this.dTick : 1;
    const minSpeed = SMEAR_MIN_SPEED * this.w * perTick;

    for (let i = 0; i < n; i++) {
      const d = draws[i];
      const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
      if (speed > minSpeed) {
        // Flat stamps trailing back along the letter's own velocity: a real
        // blur would break the two-colours rule and cost far more.
        for (let k = SMEAR_STEPS; k >= 1; k--) {
          const back = (k / SMEAR_STEPS) * SMEAR_REACH;
          ctx.save();
          ctx.translate(d.gx - d.vx * back, d.gy - d.vy * back);
          ctx.rotate((d.deg * Math.PI) / 180);
          ctx.scale(d.sc * d.face, d.sc);
          ctx.fillText(d.g.ch, -d.g.px, -d.g.py);
          ctx.restore();
        }
      }

      ctx.save();
      ctx.translate(d.gx, d.gy);
      ctx.rotate((d.deg * Math.PI) / 180);
      ctx.scale(d.sc * d.face, d.sc);
      ctx.fillText(d.g.ch, -d.g.px, -d.g.py);
      ctx.restore();
    }
  }

  destroy() {
    this.stop();
    this.glyphs = [];
  }
}
