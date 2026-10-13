'use client';

import { useCanvas } from '@/lib/useCanvas';
import { createQuadProgram, createTexture, updateTexture } from '@/lib/gl';
import { createScene, drawScene, sceneSize } from '@/lib/scene';

/**
 * Ordered dither — smooth gradients crushed to a few colours, without banding.
 *
 * Quantising straight to N levels gives you visible bands. Ordered dithering
 * adds a position-dependent threshold first, so neighbouring pixels round in
 * different directions and the eye averages them back into the missing shades.
 *
 * The Bayer matrix is computed recursively in the shader rather than uploaded:
 * bayer(2n) is bayer(n) at half scale plus a quarter-weight bayer2, which is
 * the same recursive construction as the original matrix, three lines long.
 */
const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_tex;
uniform vec2  u_res;
uniform float u_levels;   // colours per channel
uniform float u_matrix;   // 2, 4 or 8
uniform float u_scale;    // device pixels per dither cell
uniform float u_mono;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

float bayer(vec2 p, float size) {
  float b = bayer2(p);
  if (size >= 4.0) b = bayer2(p * 0.5) * 0.25 + b;
  if (size >= 8.0) b = bayer2(p * 0.25) * 0.25 + bayer2(p * 0.5) * 0.25 + bayer2(p);
  return b;
}

void main() {
  vec3 src = texture(u_tex, v_uv).rgb;
  if (u_mono > 0.5) src = vec3(dot(src, vec3(0.2126, 0.7152, 0.0722)));

  vec2 cell = v_uv * u_res / max(u_scale, 1.0);
  // Centre the threshold on zero so dithering does not brighten the image.
  float threshold = bayer(cell, u_matrix) - 0.5;

  float n = max(u_levels - 1.0, 1.0);
  vec3 col = floor(src * n + threshold + 0.5) / n;

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export default function Dither({
  text = 'VAULT',
  levels = 3,
  matrix = 8,
  scale = 2,
  mono = false,
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
        tex: createTexture(gl, scene.canvas, { filter: 'nearest' }),
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
      const s = state.scene.canvas.width / Math.max(1, w);
      drawScene(state.scene, t, {
        text,
        pointer: pointer.inside ? { inside: true, x: pointer.x * s, y: pointer.y * s } : null,
      });
      updateTexture(gl, state.tex, state.scene.canvas);

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      state.prog.use();
      state.prog.set({
        u_tex: { texture: state.tex, unit: 0 },
        u_res: [w * dpr, h * dpr],
        u_levels: Math.max(2, levels),
        u_matrix: matrix,
        u_scale: Math.max(1, scale) * dpr,
        u_mono: mono ? 1 : 0,
      });
      state.prog.draw();
    },

    dispose: ({ state, ctx: gl }) => {
      state.prog?.dispose();
      if (state.tex) gl.deleteTexture(state.tex);
    },
  });

  return <canvas ref={ref} aria-label="A colour scene reduced to a few colours with ordered dithering" role="img" />;
}
