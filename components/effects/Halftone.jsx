'use client';

import { useCanvas } from '@/lib/useCanvas';
import { createQuadProgram, createTexture, updateTexture } from '@/lib/gl';
import { createScene, drawScene, sceneSize } from '@/lib/scene';

/**
 * Halftone press — live imagery screened into CMYK dots.
 *
 * Print cannot do grey ink, so it fakes tone with dots of varying size. Here
 * each of the four process colours gets its own grid, each rotated to the
 * traditional angle (C 15°, M 75°, Y 0°, K 45°). Within a grid the fragment
 * measures its distance to the nearest cell centre and compares it against a
 * radius derived from that channel's ink coverage — under the radius, ink.
 *
 * Rotating the four screens relative to each other is the whole trick: aligned
 * grids interfere and produce a moiré, offset ones produce the rosette.
 */
const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_tex;
uniform vec2  u_res;
uniform float u_cell;      // screen ruling, in pixels per cell
uniform float u_angle;     // global rotation of all four screens
uniform float u_contrast;
uniform float u_sharp;     // 0 = soft dots, 1 = hard edges

vec2 rot(vec2 p, float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c) * p;
}

// Coverage of one screen at this fragment, for a given ink amount.
float screen(vec2 frag, float angle, float ink) {
  vec2 p = rot(frag, angle) / u_cell;
  vec2 f = fract(p) - 0.5;
  float d = length(f) * 2.0;
  // Dot AREA should track ink, so the radius goes as sqrt.
  float r = sqrt(clamp(ink, 0.0, 1.0)) * 1.08;
  float aa = mix(0.35, 0.02, u_sharp);
  return 1.0 - smoothstep(r - aa, r + aa, d);
}

void main() {
  vec3 src = texture(u_tex, v_uv).rgb;

  // Contrast around mid grey, so the dot sizes spread out.
  src = clamp((src - 0.5) * u_contrast + 0.5, 0.0, 1.0);

  // RGB -> CMYK. k is the grey component the three inks share.
  float k = 1.0 - max(max(src.r, src.g), src.b);
  float inv = 1.0 - k;
  vec3 cmy = inv < 0.001 ? vec3(0.0) : (vec3(1.0) - src - k) / inv;

  vec2 frag = v_uv * u_res;
  const float D = 0.01745329;
  float c = screen(frag, u_angle + 15.0 * D, cmy.x);
  float m = screen(frag, u_angle + 75.0 * D, cmy.y);
  float y = screen(frag, u_angle +  0.0 * D, cmy.z);
  float kk = screen(frag, u_angle + 45.0 * D, k);

  // Subtractive: each ink removes its complementary light from the paper.
  vec3 col = vec3(1.0);
  col *= 1.0 - vec3(0.0, 0.85, 0.95) * c;
  col *= 1.0 - vec3(0.92, 0.0, 0.62) * m;
  col *= 1.0 - vec3(0.0, 0.08, 0.92) * y;
  col *= 1.0 - vec3(0.93) * kk;

  outColor = vec4(col, 1.0);
}`;

export default function Halftone({
  text = 'VAULT',
  cell = 7,
  angle = 0,
  contrast = 1.35,
  sharp = 0.45,
}) {
  const ref = useCanvas({
    context: 'webgl2',
    contextAttrs: { antialias: false, alpha: false },
    deps: [text],

    init: ({ ctx: gl, w, h }) => {
      const { w: sw, h: sh } = sceneSize(w, h);
      const scene = createScene(sw, sh);
      drawScene(scene, 0, { text });
      return {
        prog: createQuadProgram(gl, FRAG),
        tex: createTexture(gl, scene.canvas),
        scene,
      };
    },

    resize: ({ ctx: gl, w, h, state }) => {
      const { w: sw, h: sh } = sceneSize(w, h);
      state.scene.canvas.width = sw;
      state.scene.canvas.height = sh;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    },

    frame: ({ ctx: gl, w, h, dpr, t, state, pointer }) => {
      const scale = state.scene.canvas.width / Math.max(1, w);
      drawScene(state.scene, t, {
        text,
        pointer: pointer.inside
          ? { inside: true, x: pointer.x * scale, y: pointer.y * scale }
          : null,
      });
      updateTexture(gl, state.tex, state.scene.canvas);

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      state.prog.use();
      state.prog.set({
        u_tex: { texture: state.tex, unit: 0 },
        u_res: [w * dpr, h * dpr],
        u_cell: Math.max(2, cell) * dpr,
        u_angle: angle,
        u_contrast: contrast,
        u_sharp: sharp,
      });
      state.prog.draw();
    },

    dispose: ({ state, ctx: gl }) => {
      state.prog?.dispose();
      if (state.tex) gl.deleteTexture(state.tex);
    },
  });

  return <canvas ref={ref} aria-label="A colour scene screened into CMYK halftone dots" role="img" />;
}
