'use client';

import { useCanvas } from '@/lib/useCanvas';
import { createQuadProgram, createTexture, updateTexture } from '@/lib/gl';
import { createScene, drawScene, sceneSize } from '@/lib/scene';

/**
 * ASCII engine — anything on screen re-rendered as a wall of text.
 *
 * The glyph atlas is drawn at runtime into a 2D canvas, one cell per
 * character, ordered lightest to heaviest. The shader averages the source
 * over each cell, maps that brightness to an atlas index, and samples the
 * glyph's sub-rectangle. Because the ordering lives in the atlas and not in
 * the shader, you can swap the character set without recompiling anything.
 */
const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_tex;    // the source scene
uniform sampler2D u_atlas;  // glyphs, lightest -> heaviest, left to right
uniform vec2  u_res;
uniform float u_cell;       // cell size in device pixels
uniform float u_count;      // glyphs in the atlas
uniform float u_tint;       // 0 = monochrome, 1 = keep source colour
uniform float u_gamma;

void main() {
  vec2 frag = v_uv * u_res;
  vec2 cellId = floor(frag / u_cell);
  vec2 cellUV = (cellId + 0.5) * u_cell / u_res;

  // Average four taps across the cell rather than one at the centre:
  // a single sample makes thin features flicker as the scene moves.
  vec3 s = texture(u_tex, cellUV).rgb;
  s += texture(u_tex, cellUV + vec2( u_cell * 0.3, 0.0) / u_res).rgb;
  s += texture(u_tex, cellUV + vec2(-u_cell * 0.3, 0.0) / u_res).rgb;
  s += texture(u_tex, cellUV + vec2(0.0,  u_cell * 0.3) / u_res).rgb;
  s *= 0.25;

  float lum = dot(s, vec3(0.2126, 0.7152, 0.0722));
  lum = pow(clamp(lum, 0.0, 1.0), u_gamma);

  float idx = floor(lum * (u_count - 1.0) + 0.5);

  // Position inside this cell, then inside that glyph's slot in the atlas.
  vec2 local = fract(frag / u_cell);
  vec2 atlasUV = vec2((idx + local.x) / u_count, 1.0 - local.y);
  float glyph = texture(u_atlas, atlasUV).r;

  vec3 ink = mix(vec3(1.0), s / max(max(s.r, s.g), max(s.b, 0.001)), u_tint);
  outColor = vec4(ink * glyph, 1.0);
}`;

const CHARSETS = {
  classic: ' .:-=+*#%@',
  blocks: ' ░▒▓█',
  dense: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  binary: ' .01',
};

function buildAtlas(chars, cellPx = 48) {
  const c = document.createElement('canvas');
  c.width = chars.length * cellPx;
  c.height = cellPx;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${Math.round(cellPx * 0.78)}px ui-monospace, 'SF Mono', Menlo, Consolas, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], i * cellPx + cellPx / 2, cellPx * 0.54);
  }
  return c;
}

export default function Ascii({
  text = 'VAULT',
  cell = 11,
  charset = 'classic',
  tint = 1,
  gamma = 1.6,
}) {
  const chars = CHARSETS[charset] ?? CHARSETS.classic;

  const ref = useCanvas({
    context: 'webgl2',
    contextAttrs: { antialias: false, alpha: false },
    deps: [text, charset],

    init: ({ ctx: gl, w, h }) => {
      const { w: sw, h: sh } = sceneSize(w, h);
      const scene = createScene(sw, sh);
      drawScene(scene, 0, { text });
      const atlas = buildAtlas(chars);
      return {
        prog: createQuadProgram(gl, FRAG),
        tex: createTexture(gl, scene.canvas),
        atlas: createTexture(gl, atlas, { filter: 'linear' }),
        scene,
        count: chars.length,
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
        u_atlas: { texture: state.atlas, unit: 1 },
        u_res: [w * dpr, h * dpr],
        u_cell: Math.max(4, cell) * dpr,
        u_count: state.count,
        u_tint: tint,
        u_gamma: gamma,
      });
      state.prog.draw();
    },

    dispose: ({ state, ctx: gl }) => {
      state.prog?.dispose();
      if (state.tex) gl.deleteTexture(state.tex);
      if (state.atlas) gl.deleteTexture(state.atlas);
    },
  });

  return <canvas ref={ref} aria-label="A colour scene redrawn as a grid of ASCII characters" role="img" />;
}

export { CHARSETS };
