// The horse, as a figure with joints rather than a frozen outline.
//
// `horse.svg` is one merged path with the legs drawn in a single fixed pose.
// You can cut it apart and swing the pieces — and that was the first attempt —
// but rotating a leg that is already bent for a trot only ever produces a
// hobby-horse scissor. A gallop is not a leg sweeping about one joint: it is
// the knee and hock folding the leg away under the body on the way forward
// and locking it straight on the way back. That needs a second joint, which a
// flat silhouette does not have and cannot be given.
//
// So the mark is built here from limbs instead, in its own 100x70 space, with
// the proportions and the flowing mane and tail of the artwork it replaces.
// Everything is stroked with round caps in ONE colour, so the limbs weld into
// a single silhouette and no join is ever visible — which is also why the
// drawing order does not matter.
//
// The gait is a transverse gallop, the one a horse actually uses at speed.
// Each leg is planted for a little under a third of the stride and sweeps
// backward while it is straight, then folds and swings forward over the rest.
// The four are offset so the hind pair lands first and close together and the
// fore pair follows about half a stride later, which leaves one moment with
// nothing on the ground — the suspension — and that is where the body rises.

export const FIG = { w: 100, h: 70 };

const SHOULDER = { x: 44, y: 34 };
const HIP = { x: 68, y: 34 };

// Phase offsets: hind pair, then fore pair half a stride later.
const LEGS = [
  { hind: true, off: 0.0, side: 1 },
  { hind: true, off: 0.12, side: 0 },
  { hind: false, off: 0.45, side: 1 },
  { hind: false, off: 0.57, side: 0 },
];

const STANCE = 0.3;           // of the stride spent on the ground
const lerp = (a, b, t) => a + (b - a) * t;

// Angles are degrees from straight down, and POSITIVE swings toward the tail:
// the horse faces left, so forward is negative. The knee folds by adding to
// the upper segment's angle, which tucks the hoof up behind the leg on the
// way forward — get that sign wrong and the horse gallops backwards with its
// hooves over its own rump, which is exactly what the first pass did.
/** One leg's two angles at stride position s: upper swing, and knee fold. */
function pose(s, fwd, back, fold) {
  const w = s < STANCE ? s / STANCE : (s - STANCE) / (1 - STANCE);
  if (s < STANCE) {
    // Planted: the leg is straight and sweeps backward under the body.
    return { u: lerp(fwd, back, w), k: 6 * Math.sin(Math.PI * w) };
  }
  // Swinging: it folds away, carries forward, and opens again to land.
  const e = w * w * (3 - 2 * w);
  return { u: lerp(back, fwd, e), k: fold * Math.sin(Math.PI * w) };
}

function limb(ctx, x, y, deg, len, width) {
  const a = ((deg - 90) * Math.PI) / 180;
  const x2 = x + Math.cos(a) * len;
  const y2 = y - Math.sin(a) * len;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  return { x: x2, y: y2 };
}

/**
 * Draw the whole figure in FIG units. `p` is the stride position in cycles
 * and `run` fades the gait in, so at run = 0 every leg stands straight and
 * the same code draws a horse at rest.
 */
export function drawFigure(ctx, p, run) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // ---- legs, far side first so the near pair reads in front
  for (const L of [...LEGS].sort((a, b) => a.side - b.side)) {
    const s = (((p + L.off) % 1) + 1) % 1;
    const q = L.hind ? pose(s, -42, 30, 56) : pose(s, -40, 24, 62);
    const u = q.u * run;
    const k = q.k * run;

    const root = L.hind ? HIP : SHOULDER;
    const drop = L.side ? 0 : -1.5;            // the far leg sits a touch back
    const upLen = L.hind ? 14 : 16;
    const loLen = L.hind ? 18 : 16;
    const w = L.side ? 1 : 0.86;

    // The knee folds the lower segment BACKWARD against the upper one, which
    // is the whole difference between a gallop and a pair of scissors.
    const knee = limb(ctx, root.x + drop, root.y, u, upLen, 8.5 * w);
    const hoof = limb(ctx, knee.x, knee.y, u + k, loLen, 6.5 * w);
    ctx.lineWidth = 6.5 * w;
    ctx.beginPath();
    ctx.moveTo(hoof.x, hoof.y);
    ctx.lineTo(hoof.x - 3, hoof.y);
    ctx.stroke();
  }

  // ---- tail, trailing back and down. Thin on purpose: at this many rows a
  // heavy tail welds to the rump and the horse grows a wing.
  // It streams out behind rather than hanging: that is what a tail does at
  // speed, and a hanging one drops straight into the arc of the hind legs
  // and encloses a hole between them.
  const sway = Math.sin(p * Math.PI * 2) * 2.5 * run;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(74, 26);
  ctx.quadraticCurveTo(87, 23 + sway, 95, 30 + sway);
  ctx.stroke();
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(95, 30 + sway);
  ctx.lineTo(98, 37 + sway);
  ctx.stroke();

  // ---- barrel
  ctx.beginPath();
  ctx.ellipse(55, 31, 20, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- neck and head
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(44, 28);
  ctx.lineTo(27, 13);
  ctx.stroke();
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(27, 12);
  ctx.lineTo(14, 16);
  ctx.stroke();
  ctx.beginPath();                               // muzzle
  ctx.ellipse(12, 17, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [ex, ey] of [[24, 6], [29, 6]]) {   // ears
    ctx.beginPath();
    ctx.moveTo(ex - 2.5, ey + 3);
    ctx.lineTo(ex, ey - 5);
    ctx.lineTo(ex + 2.5, ey + 3);
    ctx.closePath();
    ctx.fill();
  }

  // ---- mane, streaming back off the crest
  ctx.beginPath();
  ctx.moveTo(28, 5);
  ctx.quadraticCurveTo(44, 8, 52, 24);
  ctx.quadraticCurveTo(44, 16, 30, 14);
  ctx.closePath();
  ctx.fill();
}
