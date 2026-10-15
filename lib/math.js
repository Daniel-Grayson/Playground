// Small math/easing toolkit shared by every effect. No dependencies.

export const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
export const map = (v, a, b, c, d) => lerp(c, d, clamp(invLerp(a, b, v)));
export const smoothstep = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const TAU = Math.PI * 2;

// Frame-rate independent damping. `h` is the half-life in seconds:
// after `h` seconds the remaining distance has halved, whatever the fps.
export const damp = (a, b, h, dt) => lerp(a, b, 1 - Math.pow(2, -dt / h));

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutBack = (t, s = 1.70158) =>
  1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const easeOutElastic = (t) => {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
};

// Deterministic PRNG (mulberry32) so a given seed always renders the same.
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash2 = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

// Value noise: cheap, smooth, good enough for flow fields and drift.
export function noise2(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
}

// Layered noise. More octaves = more fine detail, at linear cost.
export function fbm(x, y, octaves = 3, lacunarity = 2, gain = 0.5) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * freq, y * freq);
    norm += amp;
    freq *= lacunarity;
    amp *= gain;
  }
  return sum / norm;
}

/**
 * Sample a table of evenly spaced knots with Fritsch–Carlson monotone cubic
 * interpolation: passes through every knot, never overshoots between them, and
 * keeps the slope continuous.
 *
 * Monotonicity is a correctness requirement here, not a matter of taste.
 * Several of these pieces author their timing as measured or hand-tuned tables
 * with deliberate flat stretches, and a plain Hermite tangent bulges straight
 * through a hold — which drags a highlight off its target, or runs a hard-edged
 * shape past its landing and back, reading as a judder rather than a bounce.
 */
export function sampleMonotone(table, u) {
  const n = table.length;
  if (n === 1) return table[0];
  if (u <= 0) return table[0];
  if (u >= 1) return table[n - 1];
  const h = 1 / (n - 1);
  const x = u * (n - 1);
  const i = Math.min(n - 2, Math.floor(x));
  const t = x - i;

  const d = (k) => (table[k + 1] - table[k]) / h;
  const sec = d(i);
  const prev = i > 0 ? d(i - 1) : sec;
  const next = i + 1 < n - 1 ? d(i + 1) : sec;
  const tg = (a, b) => (a * b <= 0 ? 0 : (2 * a * b) / (a + b));
  const m0 = tg(prev, sec) * h;
  const m1 = tg(sec, next) * h;

  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * table[i] +
    (t3 - 2 * t2 + t) * m0 +
    (-2 * t3 + 3 * t2) * table[i + 1] +
    (t3 - t2) * m1
  );
}
