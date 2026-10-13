'use client';

import { useCanvas } from '@/lib/useCanvas';
import { createQuadProgram } from '@/lib/gl';

/**
 * Mesh gradient — slow colour fog for a hero section.
 *
 * Four colour sources orbit on their own slow loops, and every fragment is an
 * inverse-square-weighted blend of them. On its own that looks like four tidy
 * blobs. Domain warping — displacing the coordinates with noise *before*
 * measuring those distances — is what turns it into something weather-shaped.
 *
 * A touch of per-pixel grain on top hides the banding that any smooth 8-bit
 * gradient shows on a large area.
 */
const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2  u_res;
uniform float u_time;
uniform float u_warp;
uniform float u_grain;
uniform vec3  u_c0;
uniform vec3  u_c1;
uniform vec3  u_c2;
uniform vec3  u_c3;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = v_uv;
  uv.x *= u_res.x / u_res.y;   // work in square space so blobs stay round

  // Domain warp: bend the space, then evaluate the blend in the bent space.
  vec2 q = vec2(fbm(uv * 1.6 + u_time * 0.05),
                fbm(uv * 1.6 + vec2(5.2, 1.3) - u_time * 0.04));
  vec2 p = uv + (q - 0.5) * u_warp;

  float a = u_res.x / u_res.y;
  vec2 s0 = vec2(0.30 + sin(u_time * 0.21) * 0.16, 0.34 + cos(u_time * 0.17) * 0.14) * vec2(a, 1.0);
  vec2 s1 = vec2(0.74 + cos(u_time * 0.15) * 0.14, 0.30 + sin(u_time * 0.23) * 0.16) * vec2(a, 1.0);
  vec2 s2 = vec2(0.32 + sin(u_time * 0.13) * 0.15, 0.74 + cos(u_time * 0.19) * 0.13) * vec2(a, 1.0);
  vec2 s3 = vec2(0.70 + cos(u_time * 0.25) * 0.13, 0.70 + sin(u_time * 0.11) * 0.15) * vec2(a, 1.0);

  // Inverse-square weights, with an epsilon so a source never divides by zero.
  float w0 = 1.0 / (dot(p - s0, p - s0) + 0.02);
  float w1 = 1.0 / (dot(p - s1, p - s1) + 0.02);
  float w2 = 1.0 / (dot(p - s2, p - s2) + 0.02);
  float w3 = 1.0 / (dot(p - s3, p - s3) + 0.02);
  float sum = w0 + w1 + w2 + w3;

  vec3 col = (u_c0 * w0 + u_c1 * w1 + u_c2 * w2 + u_c3 * w3) / sum;

  // Grain, scaled to device pixels so it does not smear on retina.
  float g = hash(gl_FragCoord.xy + fract(u_time) * 100.0) - 0.5;
  col += g * u_grain;

  outColor = vec4(col, 1.0);
}`;

export default function MeshGradient({
  warp = 0.55,
  speed = 1,
  grain = 0.035,
  colors = ['#ff6b4a', '#ffd166', '#5b8cff', '#b06bff'],
}) {
  const ref = useCanvas({
    context: 'webgl2',
    contextAttrs: { antialias: false, alpha: false },
    deps: [colors.join(',')],

    init: ({ ctx: gl }) => ({ prog: createQuadProgram(gl, FRAG) }),

    resize: ({ ctx: gl }) => {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    },

    frame: ({ ctx: gl, w, h, dpr, t, state }) => {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      state.prog.use();
      const [c0, c1, c2, c3] = colors.map(hexToRgb);
      state.prog.set({
        u_res: [w * dpr, h * dpr],
        u_time: t * speed,
        u_warp: warp,
        u_grain: grain,
        u_c0: c0, u_c1: c1, u_c2: c2, u_c3: c3,
      });
      state.prog.draw();
    },

    dispose: ({ state }) => state.prog?.dispose(),
  });

  return <canvas ref={ref} aria-label="A slowly drifting mesh gradient" role="img" />;
}

function hexToRgb(hex) {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
