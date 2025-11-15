export {};

declare const self: DedicatedWorkerGlobalScope;

type HalftoneParams = {
  halftoneSize: number;
  dotSpacing: number;
  rgbOffsetX: number;
  rgbOffsetY: number;
  effectIntensity: number;
  dotRotation: number;
  patternRotation: number;
  dotShape: "circle" | "square";
};

type RenderMessage = {
  type: "render";
  params: HalftoneParams;
  requestId: number;
};

type SetSourceMessage = {
  type: "setSource";
  imageData: ImageData;
  width: number;
  height: number;
};

type WorkerMessage = RenderMessage | SetSourceMessage;

const drawDot = (
  ctx: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: "circle" | "square",
  rotation: number
) => {
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillRect(-size, -size, size * 2, size * 2);
    ctx.restore();
  }
};

type LatticeCache = {
  spacing: number;
  rotation: number;
  width: number;
  height: number;
  positions: Float32Array;
};

type WorkerState = {
  canvas: OffscreenCanvas | null;
  ctx: OffscreenCanvasRenderingContext2D | null;
  imageData: ImageData | null;
  width: number;
  height: number;
  lattice: LatticeCache | null;
};

const state: WorkerState = {
  canvas: null,
  ctx: null,
  imageData: null,
  width: 0,
  height: 0,
  lattice: null,
};

const ensureCanvas = (width: number, height: number) => {
  if (!state.canvas) {
    state.canvas = new OffscreenCanvas(width, height);
    state.ctx = state.canvas.getContext("2d", {
      willReadFrequently: false,
      desynchronized: true,
      alpha: false,
    });
  } else if (state.canvas.width !== width || state.canvas.height !== height) {
    state.canvas.width = width;
    state.canvas.height = height;
  }
  state.width = width;
  state.height = height;
  return state.ctx;
};

const approxEqual = (a: number, b: number) => Math.abs(a - b) < 0.0001;

const ensureLattice = (
  spacing: number,
  rotation: number,
  width: number,
  height: number
) => {
  const cache = state.lattice;
  if (
    cache &&
    cache.width === width &&
    cache.height === height &&
    approxEqual(cache.spacing, spacing) &&
    approxEqual(cache.rotation, rotation)
  ) {
    return cache.positions;
  }

  const positions: number[] = [];
  const angleRad = (rotation * Math.PI) / 180;
  const cosAngle = Math.cos(angleRad);
  const sinAngle = Math.sin(angleRad);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDim = Math.sqrt(width * width + height * height);
  const halfSteps = Math.ceil(maxDim / (2 * spacing));

  for (let j = -halfSteps; j <= halfSteps; j++) {
    for (let i = -halfSteps; i <= halfSteps; i++) {
      const patternX = i * spacing;
      const patternY = j * spacing;
      const rotatedX = patternX * cosAngle - patternY * sinAngle + centerX;
      const rotatedY = patternX * sinAngle + patternY * cosAngle + centerY;

      if (
        rotatedX < 0 ||
        rotatedX >= width ||
        rotatedY < 0 ||
        rotatedY >= height
      ) {
        continue;
      }

      positions.push(rotatedX, rotatedY);
    }
  }

  const typedPositions = new Float32Array(positions.length);
  typedPositions.set(positions);
  state.lattice = {
    spacing,
    rotation,
    width,
    height,
    positions: typedPositions,
  };
  return typedPositions;
};

const renderHalftone = (params: HalftoneParams): ImageData | null => {
  if (!state.imageData) return null;
  const ctx = ensureCanvas(state.imageData.width, state.imageData.height);
  if (!ctx) return null;

  const width = state.imageData.width;
  const height = state.imageData.height;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  const {
    halftoneSize,
    dotSpacing,
    rgbOffsetX,
    rgbOffsetY,
    effectIntensity,
    dotRotation,
    patternRotation,
    dotShape,
  } = params;

  const dotSize = Math.max(0.1, halftoneSize);
  const spacing = Math.max(0.1, dotSpacing);
  const offsetX = rgbOffsetX;
  const offsetY = rgbOffsetY;
  const intensity = Math.min(Math.max(effectIntensity / 100, 0), 1);

  ctx.globalCompositeOperation = "lighter";

  const sourceData = state.imageData.data;
  const latticePositions = ensureLattice(
    spacing,
    patternRotation,
    width,
    height
  );

  for (let index = 0; index < latticePositions.length; index += 2) {
    const rotatedX = latticePositions[index];
    const rotatedY = latticePositions[index + 1];

    const pixelX = Math.floor(rotatedX);
    const pixelY = Math.floor(rotatedY);
    const pixelIndex = (pixelY * width + pixelX) * 4;

    const r = sourceData[pixelIndex];
    const g = sourceData[pixelIndex + 1];
    const b = sourceData[pixelIndex + 2];

    const rBrightness = r / 255;
    const gBrightness = g / 255;
    const bBrightness = b / 255;

    const rDotSize = rBrightness * dotSize * intensity;
    ctx.fillStyle = `rgb(${r}, 0, 0)`;
    drawDot(
      ctx,
      rotatedX + offsetX,
      rotatedY + offsetY,
      rDotSize / 2,
      dotShape,
      dotRotation
    );

    const gDotSize = gBrightness * dotSize * intensity;
    ctx.fillStyle = `rgb(0, ${g}, 0)`;
    drawDot(ctx, rotatedX, rotatedY, gDotSize / 2, dotShape, dotRotation);

    const bDotSize = bBrightness * dotSize * intensity;
    ctx.fillStyle = `rgb(0, 0, ${b})`;
    drawDot(
      ctx,
      rotatedX - offsetX,
      rotatedY - offsetY,
      bDotSize / 2,
      dotShape,
      dotRotation
    );
  }

  ctx.globalCompositeOperation = "source-over";

  return ctx.getImageData(0, 0, width, height);
};

const handleMessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  if (message.type === "setSource") {
    state.imageData = message.imageData;
    ensureCanvas(message.width, message.height);
    state.lattice = null;
    return;
  }
  if (message.type === "render") {
    try {
      const result = renderHalftone(message.params);
      if (!result) {
        self.postMessage({
          type: "renderError",
          error: "Missing source image",
          requestId: message.requestId,
        });
        return;
      }
      self.postMessage(
        {
          type: "renderComplete",
          imageData: result,
          requestId: message.requestId,
        },
        [result.data.buffer]
      );
    } catch (error) {
      self.postMessage({
        type: "renderError",
        error: error instanceof Error ? error.message : "Unknown error",
        requestId: message.requestId,
      });
    }
  }
};

(self as unknown as { onmessage: typeof handleMessage }).onmessage =
  handleMessage;
