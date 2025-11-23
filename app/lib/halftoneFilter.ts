import {
  buildHalftonePublicPath,
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

  const maskPath = buildHalftonePublicPath({
    dotRadius: normalizedRadius,
    dotSpacing: normalizedSpacing,
    shape,
  });

  const maskImage = await loadImage(maskPath);

  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.putImageData(imageData, 0, 0);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = imageData.width;
  maskCanvas.height = imageData.height;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) {
    throw new Error("Failed to get mask canvas context");
  }

  const maskWidth = maskImage.width;
  const maskHeight = maskImage.height;
  const cols = Math.ceil(maskCanvas.width / maskWidth) + 1;
  const rows = Math.ceil(maskCanvas.height / maskHeight) + 1;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      maskCtx.drawImage(
        maskImage,
        col * maskWidth,
        row * maskHeight,
        maskWidth,
        maskHeight
      );
    }
  }

  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(maskCanvas, 0, 0);

  return ctx.getImageData(0, 0, imageData.width, imageData.height);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img);
      } else {
        reject(new Error(`Image failed to decode: ${src}`));
      }
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });
}
