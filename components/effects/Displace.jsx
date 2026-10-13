'use client';

import { useCanvas } from '@/lib/useCanvas';
import { createQuadProgram, createTexture, updateTexture } from '@/lib/gl';
import { createScene, drawScene, sceneSize } from '@/lib/scene';

/**
 * Ripple displace — the image bends away from the cursor and splits to colour.
 *
 * Displacement is just lying about where to sample: offset the UV by a wave
 * that decays with distance from the pointer, and the picture bends. Sampling
 * red, green and blue at slightly different offsets gives the fringe, for the
 * same reason a real lens cannot bring all three wavelengths to one focus.
 */
const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_tex;
uniform vec2  u_res;
uniform vec2  u_pointer;     // 0..1, y already flipped for texture space
uniform float u_time;
uniform float u_strength;
uniform float u_radius;
uniform float u_aberration;
uniform float u_active;      // fades the whole thing out when the pointer leaves

vec2 displace(vec2 uv, float k) {
  vec2 d = uv - u_pointer;
  d.x *= u_res.x / u_res.y;          // correct for aspect, else ripples are oval
  float dist = length(d);
  float falloff = exp(-dist * dist / max(u_radius * u_radius, 0.0001));
  float wave = sin(dist * 28.0 - u_time * 5.0);
  vec2 dir = dist > 0.0001 ? normalize(d) : vec2(0.0);
  return uv + dir * wave * falloff * u_strength * k * u_active;
}

void main() {
  float r = texture(u_tex, displace(v_uv, 1.0 + u_aberration)).r;
  float g = texture(u_tex, displace(v_uv, 1.0)).g;
  float b = texture(u_tex, displace(v_uv, 1.0 - u_aberration)).b;
  outColor = vec4(r, g, b, 1.0);
}`;

export default function Displace({
  text = 'VAULT',
  strength = 0.055,
  radius = 0.3,
  aberration = 0.35,
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
        active: 0,
        px: 0.5,
        py: 0.5,
      };
    },

    resize: ({ ctx: gl, w, h, state }) => {
      const { w: sw, h: sh } = sceneSize(w, h);
      state.scene.canvas.width = sw;
      state.scene.canvas.height = sh;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    },

    frame: ({ ctx: gl, w, h, dpr, t, dt, state, pointer }) => {
      drawScene(state.scene, t, { text });
      updateTexture(gl, state.tex, state.scene.canvas);

      // Without the pointer, orbit the ripple so the demo is never static.
      const target = pointer.inside ? 1 : 0;
      state.active += (target - state.active) * Math.min(1, dt * 5);
      if (pointer.inside) {
        state.px = pointer.x / Math.max(1, w);
        state.py = 1 - pointer.y / Math.max(1, h); // texture space is y-up
      } else {
        state.px = 0.5 + Math.sin(t * 0.6) * 0.2;
        state.py = 0.5 + Math.cos(t * 0.45) * 0.18;
      }

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      state.prog.use();
      state.prog.set({
        u_tex: { texture: state.tex, unit: 0 },
        u_res: [w * dpr, h * dpr],
        u_pointer: [state.px, state.py],
        u_time: t,
        u_strength: strength,
        u_radius: radius,
        u_aberration: aberration,
        // Keep a little life in it even when idle.
        u_active: 0.35 + state.active * 0.65,
      });
      state.prog.draw();
    },

    dispose: ({ state, ctx: gl }) => {
      state.prog?.dispose();
      if (state.tex) gl.deleteTexture(state.tex);
    },
  });

  return <canvas ref={ref} aria-label="A colour scene rippling and splitting into colour fringes around the pointer" role="img" />;
}
