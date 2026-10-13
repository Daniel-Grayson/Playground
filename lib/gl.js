// Minimal WebGL2 helper. Enough for fullscreen fragment-shader effects,
// deliberately not a framework.

const QUAD_VS = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader failed to compile:\n${log}`);
  }
  return sh;
}

/** Compile a fragment shader against a fullscreen-quad vertex shader. */
export function createQuadProgram(gl, fragSrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, QUAD_VS);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program failed to link:\n${log}`);
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  // Uniform locations are looked up once and memoised.
  const cache = new Map();
  const loc_ = (name) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name));
    return cache.get(name);
  };

  return {
    program,
    vao,
    use() {
      gl.useProgram(program);
      gl.bindVertexArray(vao);
    },
    /** Set uniforms from a plain object: numbers, arrays of 2-4, or {texture, unit}. */
    set(uniforms) {
      for (const [name, value] of Object.entries(uniforms)) {
        const l = loc_(name);
        if (l === null) continue; // dropped by the compiler as unused
        if (typeof value === 'number') gl.uniform1f(l, value);
        else if (typeof value === 'boolean') gl.uniform1i(l, value ? 1 : 0);
        else if (value && value.texture !== undefined) {
          gl.activeTexture(gl.TEXTURE0 + value.unit);
          gl.bindTexture(gl.TEXTURE_2D, value.texture);
          gl.uniform1i(l, value.unit);
        } else if (Array.isArray(value)) {
          if (value.length === 2) gl.uniform2fv(l, value);
          else if (value.length === 3) gl.uniform3fv(l, value);
          else if (value.length === 4) gl.uniform4fv(l, value);
        }
      }
    },
    draw() {
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(buf);
    },
  };
}

/** Upload a canvas/image/video as a texture, or update one in place. */
export function createTexture(gl, source, { filter = 'linear', wrap = 'clamp' } = {}) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const f = filter === 'nearest' ? gl.NEAREST : gl.LINEAR;
  const wm = wrap === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wm);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wm);
  if (source) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }
  return tex;
}

export function updateTexture(gl, tex, source) {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}
