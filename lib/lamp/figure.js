// The horse: the user's own artwork for everything above the legs, and
// jointed legs underneath it so it can gallop.
//
// `horse.svg` is one merged path with the legs frozen in a single trot. Two
// earlier attempts failed in opposite directions. Cutting that outline apart
// and swinging the pieces kept the look but could only ever scissor — a
// gallop is the knee and hock folding the leg away on the way forward and
// locking it straight on the way back, and a flat outline has no second
// joint to fold. Building the whole animal from stroked limbs galloped
// properly but stopped looking like a horse: a stick neck, a small head and
// four posts. So the body is the artwork, verbatim, and only the legs are
// built — shaped like legs rather than lines, so the two halves read as one
// animal.
//
// The legs taper the way a horse's do: heavy at the forearm and the thigh,
// slim through the cannon, then a hoof. The hind leg has the hock — the
// gaskin slopes back from the stifle and the cannon drops from it — which is
// the single shape that most makes a hind leg read as a horse's. Every piece
// is filled in ONE colour, legs first and the body over the roots, so the
// joins weld and none is ever visible.
//
// The gait is keyed, not computed: absolute segment angles at eight points
// of the stride for a fore leg and a hind leg, traced from a reference
// gallop loop, interpolated linearly so nothing overshoots. Angles are
// degrees from straight down, POSITIVE toward the tail — the horse faces
// left — and getting that sign backwards gallops it in reverse.

export const FIG = { w: 112, h: 67 };
export const HORSE_PATH = 'M23.8305 0C30.8902 0.323906 33.9159 3.54493 37.343 9.35344C38.0895 10.6184 39.806 12.6844 40.7529 13.9598C39.5784 13.2804 37.8989 11.9557 36.7594 11.1045C39.6295 15.2695 43.0622 16.6664 47.558 13.9573C46.8647 15.0415 46.3643 16.128 45.8027 17.2821C44.8981 17.7905 44.1321 18.225 43.2633 18.8067L43.2448 19.1295C48.9565 23.6719 63.9586 15.9624 74.2758 24.5041C84.5648 17.7122 90.6351 23.0956 95.2219 32.7366C99 40.676 98.5992 44.8392 109.488 42.5177C108.546 43.0699 106.277 44.033 105.853 44.6899C106.713 45.135 109.863 43.7473 111.131 43.3788L111.237 43.6256C109.538 45.2944 103.964 47.3747 101.562 48.057L108.312 50.0977C108.225 50.1087 108.138 50.1185 108.052 50.1277C89.761 51.9656 93.1383 46.4109 83.332 33.8963C82.4484 32.7696 80.5289 30.1697 79.4531 29.3088L79.3242 29.2066C78.3094 28.4009 77.3227 28.1937 76.0852 27.8402C76.957 35.3494 76.8328 37.107 73.8305 43.6596C74.3297 45.2248 78.3164 48.6607 79.6664 49.7529C78.2695 54.2365 76.7367 60.4191 74.3953 64.5181C74.0742 65.0801 72.6797 66.0345 72.082 66.4517C71.1258 66.4627 68.925 66.6509 68.2805 66.2372C67.7883 62.7471 71.768 63.0675 73.0219 61.8616C74.7914 60.1608 75.1969 55.2316 75.2109 52.7796C73.7508 51.1863 72.4383 50.6229 70.5422 49.6205C67.9945 47.8366 67.125 46.4731 65.257 44.0501C66.007 46.7428 66.7266 49.4438 67.4156 52.1524C66.1688 55.7623 60.7875 59.7239 58.4039 63.0342C57.6734 64.0488 51.2949 65.6745 49.8506 64.9221L49.916 64.4109C51.1306 62.5955 56.0656 61.0444 58.0549 59.3873C63.6141 54.7573 62.9812 54.0853 60.2838 48.1685C58.6455 44.5744 58.9001 43.1238 56.1752 39.4514C50.3866 40.9819 44.4945 40.8286 38.8404 38.7856C37.7114 38.3777 36.0848 37.1124 35.4185 37.0512C35.1631 37.3833 34.8305 37.9317 34.3479 37.9291C32.8048 37.9209 31.2626 37.8459 29.7195 37.8197C26.7253 37.7487 23.7293 37.7913 20.7382 37.9477L18.8805 40.4684C19.3495 42.2065 20.0288 44.0238 20.6297 45.7329C24.806 43.7025 24.7451 44.8596 25.4691 48.9094C22.8244 48.4322 19.9137 47.6815 17.2948 47.3775C16.871 45.0089 16.0667 40.811 15.926 38.5756C10.6554 41.6871 6.95204 44.5261 5.19563 50.7696C3.54399 50.6941 1.66992 50.7253 0 50.7164C2.55305 45.4809 5.48907 42.4913 9.37852 38.303C13.1018 34.2938 16.4653 33.3448 21.6642 32.2685C20.8484 27.0267 21.3783 26.0869 21.8039 20.9252C21.8721 20.0974 21.3619 16.9052 21.203 15.9023C20.3866 17.3332 18.1727 20.1701 17.1045 21.4174L16.9481 24.8466C15.4702 24.7315 13.7979 24.5025 12.3087 24.3326C11.3093 19.4548 11.029 10.0814 12.6422 5.29454C11.7823 4.31251 9.92883 2.50828 10.2094 1.1993C11.0627 1.27828 11.7851 2.72016 12.874 3.02883C13.2225 2.55305 13.4571 1.22977 13.6071 0.583127L15.4313 3.79711C18.2838 1.04813 19.8232 0.258281 23.8305 0Z';

const GROUND = 66.5;

// Every leg has THREE segments — upper leg, cannon, pastern — and the third
// is the one that matters most. Studied frame by frame off a gallop loop the
// user supplied: no leg in it is ever a straight line, not even the one
// carrying the weight, because the pastern always kinks forward at the
// fetlock and the hoof sits on the ground pointing ahead. A two-segment leg
// has no fetlock, which is exactly why the first standing pose read as four
// posts.
//
// [upper, cannon, pastern] at eight evenly spaced points of one leg's stride,
// traced from the reference's eight frames (mirrored to face left).
// Fore: land reaching forward, carry the weight as the body passes over,
// push off, then the knee folds the cannon up tight and the pastern curls
// the hoof under before the leg unfolds and reaches again.
const FORE_KEYS = [
  [-22, -20, -50], [-6, -4, -40], [8, 10, -26], [24, 30, 4],
  [22, 76, 112], [-18, 96, 132], [-40, 22, -16], [-40, -28, -54],
];
// Hind: land under the belly, drive back to full extension with the pastern
// flicking up as it leaves, then the hock folds the cannon FORWARD under the
// belly — the opposite way to the knee — and it reaches for the ground.
const HIND_KEYS = [
  [-10, -20, -46], [10, -6, -36], [28, 18, -16], [38, 44, 20],
  [40, 70, 92], [20, -18, 30], [-6, -44, -10], [-18, -38, -40],
];
// Standing: not straight. Fore legs near vertical with a soft knee, the hind
// gaskin sloping back to a hock that sits behind the leg, and every pastern
// angled forward to a hoof that points ahead. Near and far legs are set a
// little apart so all four read, instead of overlapping into two.
const REST = {
  nearFore: [-8, 2, -42], farFore: [10, 10, -30],
  nearHind: [12, -8, -38], farHind: [30, 4, -26],
};

// Each leg's root in the body, its segment lengths, its taper (top of upper,
// knee or hock, fetlock, hoof), and where it sits in the stride. Hind pair
// lands first and close together, fore pair half a stride later, which
// leaves one moment with nothing on the ground.
const LEGS = [
  { far: true,  hind: true,  rest: 'farHind',  root: [66, 41], len: [10.5, 11, 4.6], w: [9.5, 4.4, 3.2, 3.6], off: 0.12 },
  { far: true,  hind: false, rest: 'farFore',  root: [25, 37], len: [13, 11, 4.6],   w: [6.6, 4.2, 3.1, 3.5], off: 0.58 },
  { far: false, hind: true,  rest: 'nearHind', root: [62, 41], len: [10.5, 11, 4.6], w: [10, 4.6, 3.3, 3.8], off: 0.0 },
  { far: false, hind: false, rest: 'nearFore', root: [20, 37], len: [13, 11, 4.6],   w: [7, 4.4, 3.2, 3.7], off: 0.46 },
];

function keyed(keys, s) {
  const x = s * keys.length;
  const i = Math.floor(x) % keys.length;
  const j = (i + 1) % keys.length;
  const t = x - Math.floor(x);
  return keys[i].map((v, n) => v + (keys[j][n] - v) * t);
}

function end(x, y, deg, len) {
  const a = (deg * Math.PI) / 180;
  return [x + Math.sin(a) * len, y + Math.cos(a) * len];
}

/** A tapered segment from (x0,y0) to (x1,y1), w0 wide at the top and w1 at
 *  the bottom, rounded at both ends so consecutive segments weld. */
function segment(ctx, x0, y0, x1, y1, w0, w1, square = false) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  ctx.beginPath();
  ctx.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2);
  ctx.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
  ctx.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2);
  ctx.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x0, y0, w0 / 2, 0, Math.PI * 2);
  ctx.fill();
  if (!square) {
    ctx.beginPath();
    ctx.arc(x1, y1, w1 / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

let BODY = null;

/**
 * Draw the whole horse in FIG units. `p` is the stride position in cycles;
 * `run` blends from the standing pose (0) to the gallop (1), so the same
 * code draws it at rest. Fill and stroke style are the caller's.
 */
export function drawFigure(ctx, p, run) {
  if (!BODY) BODY = typeof Path2D === 'function' ? new Path2D(HORSE_PATH) : null;

  // A gallop pitches the body nose-up on the gather and nose-down on the
  // reach, and lifts it in the suspension. Both small: it is the legs that
  // say running.
  const pitch = 2.2 * run * Math.sin((p + 0.15) * Math.PI * 2);
  const lift = -1.4 * run * (1 - Math.cos((p + 0.2) * Math.PI * 2)) / 2;
  ctx.save();
  ctx.translate(56, 34 + lift);
  ctx.rotate((pitch * Math.PI) / 180);
  ctx.translate(-56, -34);

  for (const L of LEGS) {
    const s = (((p + L.off) % 1) + 1) % 1;
    const g = keyed(L.hind ? HIND_KEYS : FORE_KEYS, s);
    const r = REST[L.rest];
    const a = r.map((v, n) => v + (g[n] - v) * run);

    let [x, y] = L.root;
    for (let n = 0; n < 3; n++) {
      const [nx, ny] = end(x, y, a[n], L.len[n]);
      segment(ctx, x, y, nx, ny, L.w[n], L.w[n + 1]);
      // The knee and hock stand a little proud of the leg, which is the
      // knobbled outline a horse's joints actually have.
      if (n < 2) {
        ctx.beginPath();
        ctx.arc(nx, ny, L.w[n + 1] / 2 + 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      [x, y] = [nx, ny];
    }
    // The hoof: a flared wedge carried on the pastern's own line and cut
    // square. A rounded end here is what turns a horse's leg into a lollipop.
    const [hx, hy] = end(x, y, a[2] * 0.6, 2.4);
    segment(ctx, x, y, hx, hy, L.w[3], L.w[3] + 1.4, true);
  }

  // The artwork, with its own frozen legs cut away below the belly. Its
  // belly hangs lower behind the girth, so the cut steps down there; the
  // tail, past x 82, is kept whole.
  if (BODY) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-20, -20, 38, 20 + 33);      // ahead of the shoulder: above the old foreleg's start
    ctx.rect(18, -20, 142, 20 + 39.5);    // meets the rect above exactly: any gap slices the head
    ctx.rect(30, 30, 52, 42 - 30);
    ctx.rect(82, -20, 60, 120);
    ctx.clip();
    ctx.fill(BODY);
    ctx.restore();
  }
  ctx.restore();
}

export { GROUND };
