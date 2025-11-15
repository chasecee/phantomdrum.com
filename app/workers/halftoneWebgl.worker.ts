import {
  ClampToEdgeWrapping,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  Vector2,
  WebGLRenderer,
} from "three";

type InitMessage = {
  type: "init";
  canvas: OffscreenCanvas;
  config: {
    width: number;
    height: number;
    dpr: number;
    imageSrc: string;
  };
  params: HalftoneParams;
};

type ParamsMessage = {
  type: "params";
  params: HalftoneParams;
};

type ResizeMessage = {
  type: "resize";
  width: number;
  height: number;
  dpr: number;
};

type VisibilityMessage = {
  type: "visibility";
  isVisible: boolean;
};

type DisposeMessage = { type: "dispose" };

type WorkerMessage =
  | InitMessage
  | ParamsMessage
  | ResizeMessage
  | VisibilityMessage
  | DisposeMessage;

type HalftoneParams = {
  halftoneSize: number;
  dotSpacing: number;
  rgbOffset: number;
  effectIntensity: number;
  brightness: number;
  contrast: number;
};

const state = {
  renderer: null as WebGLRenderer | null,
  scene: null as Scene | null,
  camera: null as OrthographicCamera | null,
  mesh: null as Mesh | null,
  texture: null as Texture | null,
  uniforms: null as ShaderMaterial["uniforms"] | null,
  params: null as HalftoneParams | null,
  dimensions: { width: 0, height: 0, dpr: 1 },
  imageSrc: "",
  sourceBitmap: null as ImageBitmap | null,
  isVisible: false,
  isAnimating: false,
  needsRender: true,
};

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform float uDotSpacing;
  uniform float uHalftoneSize;
  uniform float uRgbOffset;
  uniform float uIntensity;
  uniform float uBrightness;
  uniform float uContrast;
  uniform vec2 uUvScale;

  varying vec2 vUv;

  float computeLuminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }

  vec3 sampleTexture(vec2 uv, vec2 offset) {
    vec2 coverUv = (uv - 0.5) * uUvScale + 0.5;
    coverUv = clamp(coverUv, vec2(0.0), vec2(1.0));
    vec2 flippedUv = vec2(coverUv.x, 1.0 - coverUv.y);
    vec3 color = texture2D(uTexture, flippedUv + offset).rgb;
    color = (color - 0.5) * uContrast + 0.5;
    color *= uBrightness;
    return clamp(color, 0.0, 1.0);
  }

  void main() {
    vec2 centeredPixel = (vUv - 0.5) * uResolution;
    vec2 grid = (floor(centeredPixel / uDotSpacing) + 0.5) * uDotSpacing;
    vec2 local = centeredPixel - grid;
    float dist = length(local);

    vec2 worldPos = grid + uResolution * 0.5;
    vec2 uv = worldPos / uResolution;

    vec3 baseColor = sampleTexture(uv, vec2(0.0));
    float intensity = computeLuminance(baseColor) * uIntensity;
    float dotRadius = uHalftoneSize * max(intensity, 0.05);

    vec3 rColor = sampleTexture(uv, vec2(uRgbOffset / uResolution.x, uRgbOffset / uResolution.y));
    vec3 gColor = sampleTexture(uv, vec2(0.0));
    vec3 bColor = sampleTexture(uv, vec2(-uRgbOffset / uResolution.x, -uRgbOffset / uResolution.y));

    float rDot = step(dist, dotRadius * rColor.r);
    float gDot = step(dist, dotRadius * gColor.g);
    float bDot = step(dist, dotRadius * bColor.b);

    vec3 finalColor = vec3(rDot * rColor.r, gDot * gColor.g, bDot * bColor.b);
    float alpha = max(max(rDot, gDot), bDot);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const vertexShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const ensureRenderer = (canvas: OffscreenCanvas) => {
  if (state.renderer) return;
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
  });
  renderer.setPixelRatio(state.dimensions.dpr);
  renderer.setSize(state.dimensions.width, state.dimensions.height, false);
  state.renderer = renderer;

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  state.scene = scene;
  state.camera = camera;
};

const createMaterial = () => {
  const uniforms = {
    uTexture: { value: state.texture },
    uResolution: {
      value: new Vector2(state.dimensions.width, state.dimensions.height),
    },
    uDotSpacing: { value: state.params?.dotSpacing ?? 16 },
    uHalftoneSize: { value: state.params?.halftoneSize ?? 6 },
    uRgbOffset: { value: state.params?.rgbOffset ?? 0.5 },
    uIntensity: { value: state.params?.effectIntensity ?? 1 },
    uBrightness: { value: state.params?.brightness ?? 1 },
    uContrast: { value: state.params?.contrast ?? 1 },
    uUvScale: { value: new Vector2(1, 1) },
  };

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
  });

  return { material, uniforms };
};

const ensureScene = () => {
  if (!state.scene) return;
  if (state.mesh) {
    state.scene.remove(state.mesh);
    state.mesh.geometry.dispose();
    (state.mesh.material as ShaderMaterial).dispose();
  }
  const geometry = new PlaneGeometry(2, 2);
  const { material, uniforms } = createMaterial();
  const mesh = new Mesh(geometry, material);
  state.mesh = mesh;
  state.uniforms = uniforms;
  state.scene.add(mesh);
};

const updateUniforms = () => {
  if (!state.uniforms || !state.params) return;
  state.uniforms.uDotSpacing.value = state.params.dotSpacing;
  state.uniforms.uHalftoneSize.value = state.params.halftoneSize;
  state.uniforms.uRgbOffset.value = state.params.rgbOffset;
  state.uniforms.uIntensity.value = state.params.effectIntensity;
  state.uniforms.uBrightness.value = state.params.brightness;
  state.uniforms.uContrast.value = state.params.contrast;
};

const updateUvScale = () => {
  if (!state.uniforms) return;
  state.uniforms.uUvScale.value.set(1, 1);
};

const buildTextureFromSource = () => {
  if (!state.sourceBitmap) return;
  const width = Math.max(1, Math.floor(state.dimensions.width));
  const height = Math.max(1, Math.floor(state.dimensions.height));
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageWidth = state.sourceBitmap.width;
  const imageHeight = state.sourceBitmap.height;
  const coverScale = Math.max(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * coverScale;
  const drawHeight = imageHeight * coverScale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(state.sourceBitmap, offsetX, offsetY, drawWidth, drawHeight);

  const processedBitmap = canvas.transferToImageBitmap();
  if (state.texture) {
    state.texture.dispose();
  }

  const texture = new Texture(processedBitmap);
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  state.texture = texture;
  if (state.uniforms) {
    state.uniforms.uTexture.value = texture;
  }
  updateUvScale();
  state.needsRender = true;
};

const loadTexture = async () => {
  if (!state.imageSrc) return;
  const response = await fetch(state.imageSrc);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  state.sourceBitmap = bitmap;
  buildTextureFromSource();
};

const renderFrame = () => {
  if (!state.renderer || !state.scene || !state.camera) return;
  if (!state.texture) return;
  updateUniforms();
  state.renderer.render(state.scene, state.camera);
  state.needsRender = false;
};

const startLoop = () => {
  if (!state.renderer || state.isAnimating) return;
  state.isAnimating = true;
  state.renderer.setAnimationLoop(() => {
    if (!state.isVisible && !state.needsRender) {
      stopLoop();
      return;
    }
    renderFrame();
  });
};

const stopLoop = () => {
  if (!state.renderer || !state.isAnimating) return;
  state.renderer.setAnimationLoop(null);
  state.isAnimating = false;
};

const handleResize = (dimensions: {
  width: number;
  height: number;
  dpr: number;
}) => {
  if (!state.renderer || !state.uniforms) return;
  state.dimensions = dimensions;
  state.renderer.setPixelRatio(dimensions.dpr);
  state.renderer.setSize(dimensions.width, dimensions.height, false);
  state.uniforms.uResolution.value.set(dimensions.width, dimensions.height);
  buildTextureFromSource();
  state.needsRender = true;
  if (state.isVisible) {
    startLoop();
  } else {
    renderFrame();
  }
};

const dispose = () => {
  stopLoop();
  if (state.mesh) {
    state.mesh.geometry.dispose();
    (state.mesh.material as ShaderMaterial).dispose();
    state.mesh = null;
  }
  if (state.texture) {
    state.texture.dispose();
    state.texture = null;
  }
  if (state.renderer) {
    state.renderer.dispose();
    state.renderer = null;
  }
  state.scene = null;
  state.camera = null;
  state.uniforms = null;
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  switch (message.type) {
    case "init": {
      state.dimensions = {
        width: message.config.width,
        height: message.config.height,
        dpr: message.config.dpr,
      };
      state.imageSrc = message.config.imageSrc;
      state.params = message.params;
      ensureRenderer(message.canvas);
      ensureScene();
      await loadTexture();
      state.needsRender = true;
      if (state.isVisible) {
        startLoop();
      } else {
        renderFrame();
      }
      break;
    }
    case "params": {
      state.params = message.params;
      state.needsRender = true;
      if (state.isVisible) {
        startLoop();
      } else {
        renderFrame();
      }
      break;
    }
    case "resize": {
      handleResize({
        width: message.width,
        height: message.height,
        dpr: message.dpr,
      });
      break;
    }
    case "visibility": {
      state.isVisible = message.isVisible;
      if (state.isVisible) {
        startLoop();
      } else {
        state.needsRender = true;
        renderFrame();
        stopLoop();
      }
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
