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

  const { image: maskImage, url: maskUrl } = await loadImage(maskPath);

  try {
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
  } finally {
    URL.revokeObjectURL(maskUrl);
  }
}

async function loadImage(
  src: string
): Promise<{ image: HTMLImageElement; url: string }> {
  const response = await fetch(src, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load image: ${src}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ image: img, url });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to decode image: ${src}`));
    };
    img.src = url;
  });
}
