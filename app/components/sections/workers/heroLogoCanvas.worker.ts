/// <reference lib="webworker" />

type InitMessage = {
  type: "init";
  canvas: OffscreenCanvas;
  aspectRatio: number;
};

type BitmapMessage = {
  type: "bitmap";
  bitmap: ImageBitmap;
};

type ResizeMessage = {
  type: "resize";
  width: number;
  devicePixelRatio: number;
};

type ScaleMessage = {
  type: "scale";
  value: number;
};

type DisposeMessage = { type: "dispose" };

type WorkerMessage =
  | InitMessage
  | BitmapMessage
  | ResizeMessage
  | ScaleMessage
  | DisposeMessage;

type RendererState = {
  canvas: OffscreenCanvas | null;
  gl: WebGLRenderingContext | null;
  program: WebGLProgram | null;
  positionBuffer: WebGLBuffer | null;
  uvBuffer: WebGLBuffer | null;
  texture: WebGLTexture | null;
  uniforms: {
    scale: WebGLUniformLocation | null;
  };
  width: number;
  devicePixelRatio: number;
  aspectRatio: number;
  scale: number;
  pendingBitmap: ImageBitmap | null;
};

const state: RendererState = {
  canvas: null,
  gl: null,
  program: null,
  positionBuffer: null,
  uvBuffer: null,
  texture: null,
  uniforms: {
    scale: null,
  },
  width: 0,
  devicePixelRatio: 1,
  aspectRatio: 1,
  scale: 1,
  pendingBitmap: null,
};

const vertexShaderSource = `
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUV;
uniform float uScale;
void main() {
  float normalizedY = (aPosition.y + 1.0) * 0.5;
  float anchoredY = 1.0 - (1.0 - normalizedY) * uScale;
  float clipY = anchoredY * 2.0 - 1.0;
  gl_Position = vec4(aPosition.x, clipY, 0.0, 1.0);
  vUV = aUV;
}
`;

const fragmentShaderSource = `
precision mediump float;
varying vec2 vUV;
uniform sampler2D uTexture;
void main() {
  gl_FragColor = texture2D(uTexture, vUV);
}
`;

const compileShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("heroLogoCanvas: failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "Unknown shader error";
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
};

const createProgram = (gl: WebGLRenderingContext) => {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );
  const program = gl.createProgram();
  if (!program) throw new Error("heroLogoCanvas: failed to create program");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? "Unknown program error";
    gl.deleteProgram(program);
    throw new Error(info);
  }
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
};

const ensureContext = (canvas: OffscreenCanvas) => {
  if (state.gl) return;
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
    depth: false,
    stencil: false,
  });
  if (!gl) throw new Error("heroLogoCanvas: WebGL context unavailable");
  const program = createProgram(gl);
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  const uvBuffer = gl.createBuffer();
  if (!positionBuffer || !uvBuffer) {
    throw new Error("heroLogoCanvas: failed to allocate buffers");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  const positionLocation = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]),
    gl.STATIC_DRAW
  );
  const uvLocation = gl.getAttribLocation(program, "aUV");
  gl.enableVertexAttribArray(uvLocation);
  gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  if (!texture) throw new Error("heroLogoCanvas: failed to create texture");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const samplerLocation = gl.getUniformLocation(program, "uTexture");
  gl.uniform1i(samplerLocation, 0);
  const scaleLocation = gl.getUniformLocation(program, "uScale");
  if (scaleLocation) {
    gl.uniform1f(scaleLocation, state.scale);
  }

  state.gl = gl;
  state.program = program;
  state.positionBuffer = positionBuffer;
  state.uvBuffer = uvBuffer;
  state.texture = texture;
  state.uniforms.scale = scaleLocation ?? null;

  if (state.pendingBitmap) {
    uploadBitmap(state.pendingBitmap);
    state.pendingBitmap = null;
  }
};

const uploadBitmap = (bitmap: ImageBitmap) => {
  const gl = state.gl;
  const texture = state.texture;
  if (!gl || !texture) {
    state.pendingBitmap?.close();
    state.pendingBitmap = bitmap;
    return;
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    bitmap
  );
  bitmap.close();
  render();
};

const updateCanvasSize = () => {
  if (!state.canvas || !state.gl || state.width <= 0) return;
  const pixelWidth = Math.max(
    1,
    Math.round(state.width * Math.max(state.devicePixelRatio, 1))
  );
  const pixelHeight = Math.max(
    1,
    Math.round(pixelWidth * state.aspectRatio)
  );
  if (
    state.canvas.width !== pixelWidth ||
    state.canvas.height !== pixelHeight
  ) {
    state.canvas.width = pixelWidth;
    state.canvas.height = pixelHeight;
  }
  state.gl.viewport(0, 0, pixelWidth, pixelHeight);
};

const render = () => {
  if (!state.gl || !state.texture) return;
  state.gl.clearColor(0, 0, 0, 0);
  state.gl.clear(state.gl.COLOR_BUFFER_BIT);
  state.gl.drawArrays(state.gl.TRIANGLE_STRIP, 0, 4);
};

const dispose = () => {
  state.pendingBitmap?.close();
  state.pendingBitmap = null;
  if (state.gl) {
    if (state.texture) {
      state.gl.deleteTexture(state.texture);
    }
    if (state.positionBuffer) {
      state.gl.deleteBuffer(state.positionBuffer);
    }
    if (state.uvBuffer) {
      state.gl.deleteBuffer(state.uvBuffer);
    }
    if (state.program) {
      state.gl.deleteProgram(state.program);
    }
  }
  state.canvas = null;
  state.gl = null;
  state.program = null;
  state.positionBuffer = null;
  state.uvBuffer = null;
  state.texture = null;
  state.uniforms.scale = null;
};

const applyScaleUniform = () => {
  if (!state.gl || !state.uniforms.scale) return;
  state.gl.uniform1f(state.uniforms.scale, state.scale);
};

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  switch (message.type) {
    case "init": {
      state.canvas = message.canvas;
      state.aspectRatio = message.aspectRatio > 0 ? message.aspectRatio : 1;
      ensureContext(message.canvas);
      updateCanvasSize();
      break;
    }
    case "bitmap": {
      if (!state.canvas) {
        state.pendingBitmap?.close();
        state.pendingBitmap = message.bitmap;
        break;
      }
      ensureContext(state.canvas);
      uploadBitmap(message.bitmap);
      break;
    }
    case "resize": {
      state.width = message.width;
      state.devicePixelRatio =
        message.devicePixelRatio > 0 ? message.devicePixelRatio : 1;
      updateCanvasSize();
      render();
      break;
    }
    case "scale": {
      state.scale = Math.max(0.05, Math.min(1, message.value));
      applyScaleUniform();
      render();
      break;
    }
    case "dispose": {
      dispose();
      break;
    }
    default:
      break;
  }
};

export {};

