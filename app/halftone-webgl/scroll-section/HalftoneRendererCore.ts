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

export type HalftoneRendererParams = {
  halftoneSize: number;
  dotSpacing: number;
  rgbOffset: number;
  rgbOffsetAngle: number;
  effectIntensity: number;
  brightness: number;
  contrast: number;
  patternRotation: number;
  zoom: number;
};

export type HalftoneRendererConfig = {
  width: number;
  height: number;
  dpr: number;
  imageSrc: string;
  fitMode: "cover" | "contain";
};

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform float uDotSpacing;
  uniform float uHalftoneSize;
  uniform vec2 uRgbOffsetVector;
  uniform float uIntensity;
  uniform float uBrightness;
  uniform float uContrast;
  uniform vec2 uUvScale;
  uniform float uPatternRotation;

  varying vec2 vUv;

  float computeLuminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }

  vec3 sampleTexture(vec2 uv, vec2 offset) {
    vec2 coverUv = (uv - 0.5) * uUvScale + 0.5;
    coverUv = clamp(coverUv, vec2(0.0), vec2(1.0));
    vec2 flippedUv = vec2(coverUv.x, 1.0 - coverUv.y);
    vec2 offsetUv = clamp(flippedUv + offset, vec2(0.0), vec2(1.0));
    vec3 color = texture2D(uTexture, offsetUv).rgb;
    color = (color - 0.5) * uContrast + 0.5;
    color *= uBrightness;
    return clamp(color, 0.0, 1.0);
  }

  void main() {
    vec2 centeredPixel = (vUv - 0.5) * uResolution;
    float cosP = cos(uPatternRotation);
    float sinP = sin(uPatternRotation);
    vec2 rotationMatrix = vec2(
      cosP * centeredPixel.x - sinP * centeredPixel.y,
      sinP * centeredPixel.x + cosP * centeredPixel.y
    );
    vec2 rotatedGrid = (floor(rotationMatrix / uDotSpacing) + 0.5) * uDotSpacing;
    vec2 local = rotationMatrix - rotatedGrid;
    float dist = length(local);

    vec2 inverseRotatedGrid = vec2(
      cosP * rotatedGrid.x + sinP * rotatedGrid.y,
      -sinP * rotatedGrid.x + cosP * rotatedGrid.y
    );
    vec2 worldPos = inverseRotatedGrid + uResolution * 0.5;
    vec2 uv = worldPos / uResolution;

    vec3 baseColor = sampleTexture(uv, vec2(0.0));
    float intensity = computeLuminance(baseColor) * uIntensity;
    float dotRadius = uHalftoneSize * max(intensity, 0.05);

    vec3 rColor = sampleTexture(uv, uRgbOffsetVector);
    vec3 gColor = baseColor;
    vec3 bColor = sampleTexture(uv, -uRgbOffsetVector);

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

const computeCoverSourceRect = (
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number
) => {
  const imageRatio = imageWidth / imageHeight;
  const targetRatio = targetWidth / targetHeight;
  if (!Number.isFinite(imageRatio) || !Number.isFinite(targetRatio)) {
    return { x: 0, y: 0, width: imageWidth, height: imageHeight };
  }
  if (Math.abs(imageRatio - targetRatio) < 0.0001) {
    return { x: 0, y: 0, width: imageWidth, height: imageHeight };
  }
  if (targetRatio > imageRatio) {
    const cropHeight = Math.max(
      1,
      Math.min(imageHeight, imageWidth / targetRatio)
    );
    const offsetY = (imageHeight - cropHeight) / 2;
    return {
      x: 0,
      y: Math.max(0, offsetY),
      width: imageWidth,
      height: cropHeight,
    };
  }
  const cropWidth = Math.max(
    1,
    Math.min(imageWidth, imageHeight * targetRatio)
  );
  const offsetX = (imageWidth - cropWidth) / 2;
  return {
    x: Math.max(0, offsetX),
    y: 0,
    width: cropWidth,
    height: imageHeight,
  };
};

type CanvasTarget = OffscreenCanvas | HTMLCanvasElement;

export class HalftoneRendererCore {
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: OrthographicCamera | null = null;
  private mesh: Mesh | null = null;
  private texture: Texture | null = null;
  private uniforms: ShaderMaterial["uniforms"] | null = null;
  private params: HalftoneRendererParams | null = null;
  private dimensions = { width: 0, height: 0, dpr: 1 };
  private imageSrc = "";
  private sourceBitmap: ImageBitmap | HTMLCanvasElement | null = null;
  private fitMode: "cover" | "contain" = "cover";
  private isVisible = false;
  private isAnimating = false;
  private needsRender = true;
  private disposed = false;

  constructor(private canvas: CanvasTarget) {}

  async init(config: HalftoneRendererConfig, params: HalftoneRendererParams) {
    this.params = params;
    this.dimensions = {
      width: config.width,
      height: config.height,
      dpr: config.dpr,
    };
    this.imageSrc = config.imageSrc;
    this.fitMode = config.fitMode;
    this.ensureRenderer();
    this.ensureScene();
    await this.loadTexture();
    this.needsRender = true;
    this.renderOrStart();
  }

  updateParams(params: HalftoneRendererParams) {
    this.params = params;
    this.needsRender = true;
    this.renderOrStart();
  }

  resize(width: number, height: number, dpr: number) {
    if (!this.renderer || !this.uniforms) return;
    this.dimensions = { width, height, dpr };
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
    this.uniforms.uResolution.value.set(width, height);
    this.buildTextureFromSource();
    this.needsRender = true;
    this.renderOrStart();
  }

  async updateImage(imageSrc: string, fitMode: "cover" | "contain") {
    if (this.imageSrc === imageSrc && this.fitMode === fitMode) return;
    this.imageSrc = imageSrc;
    this.fitMode = fitMode;
    await this.loadTexture();
    this.needsRender = true;
    this.renderOrStart();
  }

  setVisibility(isVisible: boolean) {
    this.isVisible = isVisible;
    if (this.isVisible) {
      this.startLoop();
      return;
    }
    this.renderFrame();
    this.stopLoop();
  }

  dispose() {
    this.disposed = true;
    this.stopLoop();
    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as ShaderMaterial).dispose();
      this.mesh = null;
    }
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this.uniforms = null;
    this.sourceBitmap = null;
  }

  private ensureRenderer() {
    if (this.renderer) return;
    const renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });
    renderer.setPixelRatio(this.dimensions.dpr);
    renderer.setSize(this.dimensions.width, this.dimensions.height, false);
    this.renderer = renderer;
    this.scene = new Scene();
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  private ensureScene() {
    if (!this.scene) return;
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as ShaderMaterial).dispose();
    }
    const geometry = new PlaneGeometry(2, 2);
    const { material, uniforms } = this.createMaterial();
    const mesh = new Mesh(geometry, material);
    this.mesh = mesh;
    this.uniforms = uniforms;
    this.scene.add(mesh);
  }

  private createMaterial() {
    const uniforms = {
      uTexture: { value: this.texture },
      uResolution: {
        value: new Vector2(this.dimensions.width, this.dimensions.height),
      },
      uDotSpacing: { value: this.params?.dotSpacing ?? 16 },
      uHalftoneSize: { value: this.params?.halftoneSize ?? 6 },
      uRgbOffsetVector: { value: new Vector2(0, 0) },
      uIntensity: { value: this.params?.effectIntensity ?? 1 },
      uBrightness: { value: this.params?.brightness ?? 1 },
      uContrast: { value: this.params?.contrast ?? 1 },
      uUvScale: { value: new Vector2(1, 1) },
      uPatternRotation: { value: this.params?.patternRotation ?? 0 },
    };

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });

    return { material, uniforms };
  }

  private async loadTexture() {
    if (!this.imageSrc) return;
    const response = await fetch(this.imageSrc);
    const blob = await response.blob();
    const bitmap = await this.decodeSourceBitmap(blob);
    this.sourceBitmap = bitmap;
    this.buildTextureFromSource();
  }

  private buildTextureFromSource() {
    if (!this.sourceBitmap) return;
    const width = Math.max(1, Math.floor(this.dimensions.width));
    const height = Math.max(1, Math.floor(this.dimensions.height));
    const surface = this.createProcessingSurface(width, height);
    const ctx = surface.getContext("2d");
    if (!ctx) return;

    const imageWidth = this.sourceBitmap.width;
    const imageHeight = this.sourceBitmap.height;
    ctx.clearRect(0, 0, width, height);

    if (this.fitMode === "cover") {
      const {
        x,
        y,
        width: srcWidth,
        height: srcHeight,
      } = computeCoverSourceRect(imageWidth, imageHeight, width, height);
      ctx.drawImage(
        this.sourceBitmap,
        x,
        y,
        srcWidth,
        srcHeight,
        0,
        0,
        width,
        height
      );
    } else {
      const scale = Math.min(width / imageWidth, height / imageHeight);
      const drawWidth = imageWidth * scale;
      const drawHeight = imageHeight * scale;
      const offsetX = (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2;
      ctx.drawImage(this.sourceBitmap, offsetX, offsetY, drawWidth, drawHeight);
    }

    const textureSource =
      "transferToImageBitmap" in surface
        ? (surface as OffscreenCanvas).transferToImageBitmap()
        : surface;

    if (this.texture) {
      this.texture.dispose();
    }

    const texture = new Texture(
      textureSource as ImageBitmap | HTMLCanvasElement
    );
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.needsUpdate = true;
    this.texture = texture;
    if (this.uniforms) {
      this.uniforms.uTexture.value = texture;
    }
    this.updateUvScale();
    this.needsRender = true;
  }

  private createProcessingSurface(width: number, height: number) {
    if (typeof OffscreenCanvas !== "undefined") {
      return new OffscreenCanvas(width, height);
    }
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }
    throw new Error("No canvas implementation available for halftone renderer");
  }

  private async decodeSourceBitmap(blob: Blob) {
    if (typeof createImageBitmap === "function") {
      return createImageBitmap(blob);
    }
    if (typeof document === "undefined") {
      throw new Error("createImageBitmap is unavailable in this environment");
    }
    return new Promise<HTMLCanvasElement>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        canvas.width = image.width || 1;
        canvas.height = image.height || 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to acquire canvas context"));
          return;
        }
        ctx.drawImage(image, 0, 0);
        resolve(canvas);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to decode image"));
      };
      image.src = url;
    });
  }

  private updateUniforms() {
    if (!this.uniforms || !this.params) return;
    this.uniforms.uDotSpacing.value = this.params.dotSpacing;
    this.uniforms.uHalftoneSize.value = this.params.halftoneSize;
    const angle = this.params.rgbOffsetAngle ?? 0;
    const magnitude = this.params.rgbOffset ?? 0;
    const x = Math.cos(angle) * magnitude;
    const y = Math.sin(angle) * magnitude;
    const width = Math.max(1, this.dimensions.width);
    const height = Math.max(1, this.dimensions.height);
    this.uniforms.uRgbOffsetVector.value.set(x / width, y / height);
    this.uniforms.uIntensity.value = this.params.effectIntensity;
    this.uniforms.uBrightness.value = this.params.brightness;
    this.uniforms.uContrast.value = this.params.contrast;
    this.uniforms.uPatternRotation.value = this.params.patternRotation;
    this.updateUvScale();
  }

  private updateUvScale() {
    if (!this.uniforms) return;
    const zoom = Math.max(0.01, this.params?.zoom ?? 1);
    this.uniforms.uUvScale.value.set(zoom, zoom);
  }

  private renderFrame() {
    if (!this.renderer || !this.scene || !this.camera) return;
    if (!this.texture) return;
    if (!this.needsRender && !this.isVisible) return;
    this.updateUniforms();
    this.renderer.render(this.scene, this.camera);
    this.needsRender = false;
  }

  private startLoop() {
    if (!this.renderer || this.isAnimating) return;
    this.isAnimating = true;
    this.renderer.setAnimationLoop(() => {
      if (this.disposed) {
        this.stopLoop();
        return;
      }
      if (!this.isVisible && !this.needsRender) {
        this.stopLoop();
        return;
      }
      this.renderFrame();
    });
  }

  private stopLoop() {
    if (!this.renderer || !this.isAnimating) return;
    this.renderer.setAnimationLoop(null);
    this.isAnimating = false;
  }

  private renderOrStart() {
    if (this.isVisible) {
      this.startLoop();
    } else {
      this.renderFrame();
    }
  }
}
