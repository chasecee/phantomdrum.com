import {
  buildHalftoneKey,
  buildHalftonePublicPath,
  computeHalftoneTileSize,
  normalizeHalftoneValue,
} from "./halftoneAssetKey.js";

export interface HalftoneFilterParams {
  dotRadius: number;
  dotSpacing: number;
  shape?: "circle" | "square" | "octagon" | "hexagon" | "triangle";
}

export async function applyHalftoneFilter(
  imageData: ImageData,
  params: HalftoneFilterParams
): Promise<ImageData> {
  const { dotRadius, dotSpacing, shape = "circle" } = params;
  const normalizedRadius = normalizeHalftoneValue(dotRadius);
  const normalizedSpacing = normalizeHalftoneValue(dotSpacing);

  const halftoneKey = buildHalftoneKey({
    dotRadius: normalizedRadius,
    dotSpacing: normalizedSpacing,
    shape,
  });
  const maskPath = buildHalftonePublicPath({
    dotRadius: normalizedRadius,
    dotSpacing: normalizedSpacing,
    shape,
  });
  const tileSize = computeHalftoneTileSize(normalizedSpacing, shape);

  const maskImage = await loadImage(maskPath);

  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.putImageData(imageData, 0, 0);

  const pattern = ctx.createPattern(maskImage, "repeat");
  if (!pattern) {
    throw new Error("Failed to create pattern");
  }

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = imageData.width;
  maskCanvas.height = imageData.height;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) {
    throw new Error("Failed to get mask canvas context");
  }

  maskCtx.fillStyle = pattern;
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(maskCanvas, 0, 0);

  return ctx.getImageData(0, 0, imageData.width, imageData.height);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
