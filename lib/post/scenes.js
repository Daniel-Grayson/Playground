// The scenes, as tone maps. Each draws greys into a w×h canvas where black is
// full ink and white is bare paper; `engrave` in the engine turns that into
// lines. Coordinates are fractions of the picture, so a scene is the same
// drawing at every size. Tones are given as ink coverage, 0 to 1.

import { rng } from '../math';

const T = (d) => {
  const v = Math.round(255 * (1 - d));
  return `rgb(${v},${v},${v})`;
};

function sky(c, w, h, top, bottom, until = 1) {
  const g = c.createLinearGradient(0, 0, 0, h * until);
  g.addColorStop(0, T(top));
  g.addColorStop(1, T(bottom));
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}

function sun(c, w, h, x, y, r, halo = 0) {
  if (halo) {
    const g = c.createRadialGradient(x * w, y * h, r * h, x * w, y * h, (r + halo) * h);
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x * w, y * h, (r + halo) * h, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = T(0);
  c.beginPath();
  c.arc(x * w, y * h, r * h, 0, Math.PI * 2);
  c.fill();
}

function water(c, w, h, y0, d) {
  c.fillStyle = T(d);
  c.fillRect(0, y0 * h, w, h);
  // A few bright ripples: gaps in the line screen read as glints.
  const r = rng(Math.round(y0 * 1000));
  c.fillStyle = T(d * 0.25);
  for (let i = 0; i < 14; i++) {
    const x = r() * w;
    const y = (y0 + 0.03 + r() * (0.97 - y0)) * h;
    c.fillRect(x, y, (0.04 + r() * 0.1) * w, Math.max(1, 0.008 * h));
  }
}

function poly(c, w, h, pts, d) {
  c.fillStyle = T(d);
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x * w, y * h) : c.moveTo(x * w, y * h)));
  c.closePath();
  c.fill();
}

function rect(c, w, h, x, y, rw, rh, d) {
  c.fillStyle = T(d);
  c.fillRect(x * w, y * h, rw * w, rh * h);
}

const SCENES = {
  newyork(c, w, h) {
    sky(c, w, h, 0.32, 0.06, 0.8);
    sun(c, w, h, 0.18, 0.2, 0.07, 0.05);
    const r = rng(7);
    // Back row, lighter: distance in an engraving is fewer, thinner lines.
    for (let x = -0.02; x < 1; ) {
      const bw = 0.04 + r() * 0.05;
      const top = 0.38 + r() * 0.22;
      rect(c, w, h, x, top, bw, 1, 0.42);
      x += bw + 0.005;
    }
    // Front row, with lit windows.
    for (let x = -0.03; x < 1; ) {
      const bw = 0.05 + r() * 0.06;
      const top = 0.5 + r() * 0.24;
      rect(c, w, h, x, top, bw, 1, 0.82);
      for (let wy = top + 0.03; wy < 0.84; wy += 0.04) {
        for (let wx = x + 0.012; wx < x + bw - 0.012; wx += 0.02) {
          if (r() < 0.45) rect(c, w, h, wx, wy, 0.008, 0.016, 0.12);
        }
      }
      x += bw + 0.006;
    }
    // The Empire State: setbacks, a mast, a needle.
    const e = 0.44;
    rect(c, w, h, e - 0.06, 0.36, 0.12, 1, 0.9);
    rect(c, w, h, e - 0.045, 0.27, 0.09, 1, 0.9);
    rect(c, w, h, e - 0.03, 0.2, 0.06, 1, 0.9);
    rect(c, w, h, e - 0.015, 0.14, 0.03, 1, 0.9);
    rect(c, w, h, e - 0.004, 0.05, 0.008, 0.1, 0.95);
    rect(c, w, h, e - 0.05, 0.27, 0.025, 0.6, 0.6);  // the lit face
    // The Chrysler: stacked arches to a spike.
    const k = 0.69;
    rect(c, w, h, k - 0.05, 0.38, 0.1, 1, 0.86);
    for (let i = 0; i < 4; i++) {
      const hw = 0.045 - i * 0.01;
      const y = 0.37 - i * 0.04;
      c.fillStyle = T(0.86);
      c.beginPath();
      c.ellipse(k * w, y * h, hw * w, 0.05 * h, 0, Math.PI, 0);
      c.fill();
      c.fillStyle = T(0.15);
      for (let j = -1; j <= 1; j++) {
        c.beginPath();
        c.moveTo((k + j * hw * 0.5) * w, (y - 0.035) * h);
        c.lineTo((k + j * hw * 0.5 - 0.006) * w, (y - 0.01) * h);
        c.lineTo((k + j * hw * 0.5 + 0.006) * w, (y - 0.01) * h);
        c.fill();
      }
    }
    poly(c, w, h, [[k - 0.006, 0.22], [k, 0.08], [k + 0.006, 0.22]], 0.95);
    water(c, w, h, 0.85, 0.38);
  },

  paris(c, w, h) {
    sky(c, w, h, 0.29, 0.04, 0.85);
    sun(c, w, h, 0.74, 0.36, 0.11, 0.08);
    // Roofs across the river.
    const r = rng(3);
    c.fillStyle = T(0.5);
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= 1.02; x += 0.05) {
      const y = 0.72 + r() * 0.06;
      c.lineTo(x * w, y * h);
      c.lineTo((x + 0.025) * w, (y - 0.02 - r() * 0.03) * h);
    }
    c.lineTo(w, h);
    c.fill();
    // The tower: four legs swept in to the first stage, then a taper.
    const X = 0.5;
    poly(c, w, h, [
      [X - 0.3, 0.86], [X - 0.22, 0.75], [X - 0.17, 0.64], [X - 0.11, 0.48],
      [X - 0.07, 0.42], [X - 0.045, 0.3], [X - 0.022, 0.16], [X - 0.01, 0.11],
      [X - 0.004, 0.06], [X + 0.004, 0.06], [X + 0.01, 0.11], [X + 0.022, 0.16],
      [X + 0.045, 0.3], [X + 0.07, 0.42], [X + 0.11, 0.48], [X + 0.17, 0.64],
      [X + 0.22, 0.75], [X + 0.3, 0.86],
    ], 0.82);
    // The arch under the first stage, open to the sky behind it.
    c.fillStyle = T(0.12);
    c.beginPath();
    c.moveTo((X - 0.2) * w, 0.86 * h);
    c.quadraticCurveTo(X * w, 0.6 * h, (X + 0.2) * w, 0.86 * h);
    c.fill();
    // The lattice: lighter windows between the girders.
    c.fillStyle = T(0.35);
    for (let y = 0.2; y < 0.62; y += 0.035) {
      const hw = 0.012 + (y - 0.2) * 0.22;
      c.fillRect((X - hw * 0.6) * w, y * h, hw * 1.2 * w, 0.012 * h);
    }
    rect(c, w, h, X - 0.18, 0.62, 0.36, 0.028, 0.97);   // first stage
    rect(c, w, h, X - 0.085, 0.415, 0.17, 0.022, 0.97); // second
    rect(c, w, h, X - 0.026, 0.155, 0.052, 0.016, 0.97); // top
    water(c, w, h, 0.86, 0.3);
  },

  rio(c, w, h) {
    sky(c, w, h, 0.27, 0.05, 0.8);
    // Corcovado, far and lighter, with the statue on its peak.
    c.fillStyle = T(0.45);
    c.beginPath();
    c.moveTo(-0.1 * w, h);
    c.bezierCurveTo(0.05 * w, 0.4 * h, 0.2 * w, 0.2 * h, 0.3 * w, 0.2 * h);
    c.bezierCurveTo(0.4 * w, 0.22 * h, 0.5 * w, 0.5 * h, 0.7 * w, h);
    c.fill();
    rect(c, w, h, 0.292, 0.1, 0.016, 0.1, 0.92);
    rect(c, w, h, 0.25, 0.12, 0.1, 0.014, 0.92);
    // Sugarloaf, near and dark, lit on its left flank.
    c.fillStyle = T(0.78);
    c.beginPath();
    c.moveTo(0.42 * w, h);
    c.bezierCurveTo(0.48 * w, 0.5 * h, 0.58 * w, 0.32 * h, 0.72 * w, 0.32 * h);
    c.bezierCurveTo(0.86 * w, 0.32 * h, 0.95 * w, 0.5 * h, 1.05 * w, h);
    c.fill();
    c.fillStyle = T(0.48);
    c.beginPath();
    c.moveTo(0.46 * w, h);
    c.bezierCurveTo(0.5 * w, 0.55 * h, 0.58 * w, 0.37 * h, 0.66 * w, 0.34 * h);
    c.bezierCurveTo(0.6 * w, 0.5 * h, 0.58 * w, 0.75 * h, 0.6 * w, h);
    c.fill();
    // The cable car line, and its car.
    c.strokeStyle = T(0.95);
    c.lineWidth = Math.max(1, 0.006 * h);
    c.beginPath();
    c.moveTo(0.36 * w, 0.62 * h);
    c.quadraticCurveTo(0.52 * w, 0.48 * h, 0.7 * w, 0.32 * h);
    c.stroke();
    rect(c, w, h, 0.5, 0.49, 0.04, 0.035, 0.95);
    water(c, w, h, 0.8, 0.32);
  },

  tokyo(c, w, h) {
    sky(c, w, h, 0.3, 0.07, 0.75);
    sun(c, w, h, 0.56, 0.3, 0.2);
    // Fuji, with a ragged snowcap.
    poly(c, w, h, [[-0.05, 0.8], [0.44, 0.44], [0.62, 0.44], [1.05, 0.8]], 0.55);
    poly(c, w, h, [
      [0.36, 0.5], [0.44, 0.44], [0.62, 0.44], [0.7, 0.5],
      [0.66, 0.53], [0.62, 0.5], [0.58, 0.55], [0.53, 0.5], [0.48, 0.56], [0.44, 0.51], [0.4, 0.54],
    ], 0.04);
    rect(c, w, h, 0, 0.8, 1, 0.2, 0.62);
    // The pagoda: five roofs, each curling up at its ends.
    const X = 0.3;
    rect(c, w, h, X - 0.012, 0.12, 0.024, 0.2, 0.95); // finial
    for (let i = 0; i < 5; i++) {
      const y = 0.3 + i * 0.12;
      const hw = 0.13 + i * 0.02;
      rect(c, w, h, X - hw * 0.55, y, hw * 1.1, 0.12, 0.88);
      c.fillStyle = T(0.95);
      c.beginPath();
      c.moveTo((X - hw) * w, (y - 0.02) * h);
      c.quadraticCurveTo((X - hw * 0.6) * w, (y + 0.025) * h, X * w, (y - 0.035) * h);
      c.quadraticCurveTo((X + hw * 0.6) * w, (y + 0.025) * h, (X + hw) * w, (y - 0.02) * h);
      c.lineTo((X + hw * 0.7) * w, (y + 0.03) * h);
      c.lineTo((X - hw * 0.7) * w, (y + 0.03) * h);
      c.fill();
      rect(c, w, h, X - 0.02, y + 0.05, 0.04, 0.04, 0.3); // a lit window
    }
  },

  istanbul(c, w, h) {
    sky(c, w, h, 0.3, 0.06, 0.78);
    // The crescent.
    sun(c, w, h, 0.14, 0.2, 0.07);
    c.fillStyle = T(0.22);
    c.beginPath();
    c.arc(0.16 * w + 0.03 * h, 0.19 * h, 0.065 * h, 0, Math.PI * 2);
    c.fill();
    // Minarets, outermost first, each a pencil with two balconies.
    const minaret = (x, top) => {
      rect(c, w, h, x - 0.009, top, 0.018, 0.82 - top, 0.85);
      poly(c, w, h, [[x - 0.011, top], [x, top - 0.12], [x + 0.011, top]], 0.9);
      rect(c, w, h, x - 0.016, top + 0.12, 0.032, 0.015, 0.95);
      rect(c, w, h, x - 0.016, top + 0.26, 0.032, 0.015, 0.95);
    };
    minaret(0.2, 0.22);
    minaret(0.8, 0.22);
    minaret(0.28, 0.3);
    minaret(0.72, 0.3);
    // The body, the half domes, the dome on its drum.
    rect(c, w, h, 0.3, 0.6, 0.4, 0.22, 0.72);
    const dome = (x, y, rx, ry, d) => {
      c.fillStyle = T(d);
      c.beginPath();
      c.ellipse(x * w, y * h, rx * w, ry * h, 0, Math.PI, 0);
      c.fill();
    };
    dome(0.35, 0.6, 0.06, 0.07, 0.6);
    dome(0.65, 0.6, 0.06, 0.07, 0.6);
    dome(0.41, 0.55, 0.07, 0.08, 0.66);
    dome(0.59, 0.55, 0.07, 0.08, 0.66);
    rect(c, w, h, 0.4, 0.43, 0.2, 0.13, 0.8);
    dome(0.5, 0.44, 0.115, 0.17, 0.7);
    dome(0.47, 0.44, 0.06, 0.12, 0.38);           // light catching the dome
    rect(c, w, h, 0.497, 0.21, 0.006, 0.07, 0.95); // finial
    for (let x = 0.42; x < 0.6; x += 0.03) rect(c, w, h, x, 0.47, 0.012, 0.06, 0.2);
    water(c, w, h, 0.82, 0.36);
  },

  sydney(c, w, h) {
    sky(c, w, h, 0.27, 0.05, 0.75);
    // The bridge, behind: the arch, the deck, the hangers.
    c.strokeStyle = T(0.55);
    c.lineWidth = 0.035 * h;
    c.beginPath();
    c.moveTo(0.5 * w, 0.66 * h);
    c.quadraticCurveTo(0.8 * w, 0.04 * h, 1.1 * w, 0.66 * h);
    c.stroke();
    rect(c, w, h, 0.45, 0.52, 0.6, 0.025, 0.6);
    c.lineWidth = Math.max(1, 0.006 * h);
    for (let x = 0.56; x < 1.02; x += 0.035) {
      const t = (x - 0.5) / 0.6;
      const y = 0.66 - 2 * t * (1 - t) * 0.62 * 1.0;
      c.beginPath();
      c.moveTo(x * w, y * h);
      c.lineTo(x * w, 0.53 * h);
      c.stroke();
    }
    rect(c, w, h, 0.5, 0.48, 0.04, 0.2, 0.7);  // pylon
    // The opera house: shells leaning one way, white tile in the light and
    // a shaded underside on each.
    rect(c, w, h, 0.04, 0.68, 0.52, 0.06, 0.82);
    const shell = (x0, x1, tipX, tipY, d) => {
      c.fillStyle = T(d);
      c.beginPath();
      c.moveTo(x0 * w, 0.68 * h);
      c.quadraticCurveTo(x0 * w, tipY * h, tipX * w, tipY * h);
      c.quadraticCurveTo(((tipX + x1) / 2) * w, ((tipY + 0.68) / 2) * h, x1 * w, 0.68 * h);
      c.fill();
      c.stroke();
    };
    c.strokeStyle = T(0.95);
    c.lineWidth = Math.max(1, 0.012 * h);
    shell(0.06, 0.2, 0.18, 0.46, 0.08);
    shell(0.12, 0.26, 0.26, 0.38, 0.12);
    shell(0.2, 0.34, 0.33, 0.33, 0.06);
    shell(0.3, 0.44, 0.43, 0.42, 0.1);
    shell(0.38, 0.52, 0.5, 0.5, 0.08);
    for (const [x0, x1] of [[0.18, 0.2], [0.24, 0.26], [0.32, 0.34], [0.42, 0.44], [0.5, 0.52]]) {
      rect(c, w, h, x0, 0.6, x1 - x0, 0.08, 0.6);
    }
    water(c, w, h, 0.74, 0.34);
  },

  london(c, w, h) {
    sky(c, w, h, 0.22, 0.11, 1);
    // Parliament, low and spiky, to the left.
    c.fillStyle = T(0.55);
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, 0.66 * h);
    for (let x = 0; x < 0.42; x += 0.04) {
      c.lineTo(x * w, 0.62 * h);
      c.lineTo((x + 0.01) * w, 0.56 * h);
      c.lineTo((x + 0.02) * w, 0.62 * h);
    }
    c.lineTo(0.42 * w, 0.62 * h);
    c.lineTo(0.42 * w, h);
    c.fill();
    for (let x = 0.02; x < 0.4; x += 0.04) rect(c, w, h, x, 0.68, 0.012, 0.05, 0.2);
    // The tower.
    const X = 0.6;
    rect(c, w, h, X - 0.1, 0.46, 0.2, 0.6, 0.78);
    rect(c, w, h, X - 0.1, 0.46, 0.05, 0.6, 0.5);           // lit side
    for (let y = 0.5; y < 0.9; y += 0.06) rect(c, w, h, X - 0.03, y, 0.06, 0.03, 0.3);
    rect(c, w, h, X - 0.125, 0.3, 0.25, 0.17, 0.85);         // clock stage
    c.fillStyle = T(0.04);
    c.beginPath();
    c.arc(X * w, 0.385 * h, 0.075 * h, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = T(0.95);
    c.lineWidth = Math.max(1, 0.008 * h);
    c.beginPath();
    c.moveTo(X * w, 0.385 * h);
    c.lineTo(X * w, 0.335 * h);
    c.moveTo(X * w, 0.385 * h);
    c.lineTo((X + 0.035 * h / w) * w, 0.4 * h);
    c.stroke();
    rect(c, w, h, X - 0.1, 0.2, 0.2, 0.1, 0.7);              // belfry
    for (let x = X - 0.08; x < X + 0.08; x += 0.045) rect(c, w, h, x, 0.22, 0.02, 0.06, 0.25);
    poly(c, w, h, [[X - 0.11, 0.2], [X, 0.03], [X + 0.11, 0.2]], 0.86);
    poly(c, w, h, [[X - 0.135, 0.3], [X - 0.12, 0.24], [X - 0.105, 0.3]], 0.9);
    poly(c, w, h, [[X + 0.105, 0.3], [X + 0.12, 0.24], [X + 0.135, 0.3]], 0.9);
    // The river, and the bridge's arches in front.
    water(c, w, h, 0.88, 0.32);
    rect(c, w, h, 0, 0.84, 1, 0.04, 0.88);
    c.fillStyle = T(0.2);
    for (let x = 0.05; x < 1; x += 0.22) {
      c.beginPath();
      c.ellipse((x + 0.08) * w, 0.95 * h, 0.08 * w, 0.07 * h, 0, Math.PI, 0);
      c.fill();
    }
  },

  cairo(c, w, h) {
    sky(c, w, h, 0.26, 0.04, 0.78);
    sun(c, w, h, 0.66, 0.36, 0.15, 0.1);
    // Three pyramids, each a lit face and a shaded one.
    const pyramid = (x, top, hw, base = 0.78) => {
      poly(c, w, h, [[x - hw, base], [x, top], [x + hw * 0.35, base]], 0.3);
      poly(c, w, h, [[x + hw * 0.35, base], [x, top], [x + hw, base]], 0.78);
    };
    pyramid(0.9, 0.5, 0.17);
    pyramid(0.66, 0.4, 0.22);
    pyramid(0.36, 0.24, 0.32);
    // Courses of stone on the big one's lit face.
    c.strokeStyle = T(0.6);
    c.lineWidth = Math.max(1, 0.005 * h);
    for (let y = 0.3; y < 0.78; y += 0.05) {
      const t = (y - 0.24) / 0.54;
      c.beginPath();
      c.moveTo((0.36 - 0.32 * t) * w, y * h);
      c.lineTo((0.36 + 0.32 * 0.35 * t) * w, y * h);
      c.stroke();
    }
    // Dunes.
    c.fillStyle = T(0.4);
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, 0.8 * h);
    c.bezierCurveTo(0.3 * w, 0.74 * h, 0.6 * w, 0.86 * h, w, 0.78 * h);
    c.lineTo(w, h);
    c.fill();
    // A palm in front.
    c.strokeStyle = T(0.92);
    c.lineWidth = 0.02 * h;
    c.beginPath();
    c.moveTo(0.12 * w, h);
    c.quadraticCurveTo(0.08 * w, 0.6 * h, 0.15 * w, 0.32 * h);
    c.stroke();
    c.lineWidth = 0.022 * h;
    for (const [dx, dy] of [[-0.14, 0.1], [-0.1, -0.04], [0, -0.09], [0.1, -0.03], [0.13, 0.11]]) {
      c.beginPath();
      c.moveTo(0.15 * w, 0.32 * h);
      c.quadraticCurveTo((0.15 + dx * 0.6) * w, (0.32 + dy - 0.06) * h, (0.15 + dx) * w, (0.32 + dy + 0.04) * h);
      c.stroke();
    }
  },
};

export function drawScene(key, c, w, h) {
  c.fillStyle = '#fff';
  c.fillRect(0, 0, w, h);
  SCENES[key]?.(c, w, h);
}
