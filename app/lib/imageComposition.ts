import { applyHalftoneFilter } from "./halftoneFilter";

const NOISE_BG_URL = "/img/optimized/noise.webp";
const NOISE_BG_MAX_WIDTH = 1128;

const DEFAULT_HALFTONE_PARAMS = {
  dotRadius: 2,
  dotSpacing: 4,
  shape: "octagon" as const,
};

export type OutputFormat = "image/png" | "image/jpeg";
export interface CompositeOptions {
  outputFormat?: OutputFormat;
  quality?: number;
  scale?: number;
}

export async function compositeWithNoiseBackground(
  imageData: ImageData,
  halftoneParams?: {
    dotRadius: number;
    dotSpacing: number;
    shape?: "circle" | "square" | "octagon" | "hexagon" | "triangle";
  },
  options: CompositeOptions = {}
): Promise<Blob> {
  const scale = options.scale ?? 1;
  const width = Math.max(Math.round(imageData.width * scale), 1);
  const height = Math.max(Math.round(imageData.height * scale), 1);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  const halftone = halftoneParams || DEFAULT_HALFTONE_PARAMS;
  const halftonedImageData = await applyHalftoneFilter(imageData, halftone);

  const { image: noiseImage, url: noiseUrl } = await loadImage(NOISE_BG_URL);
  const bgWidth = Math.min(width, NOISE_BG_MAX_WIDTH);
  const bgHeight = (noiseImage.height / noiseImage.width) * bgWidth;
  const bgX = (width - bgWidth) / 2;
  const bgY = (height - bgHeight) / 2;

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(noiseImage, bgX, bgY, bgWidth, bgHeight);

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = halftonedImageData.width;
  tempCanvas.height = halftonedImageData.height;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) {
    throw new Error("Failed to get temp canvas context");
  }
  tempCtx.putImageData(halftonedImageData, 0, 0);
  ctx.drawImage(
    tempCanvas,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height,
    0,
    0,
    width,
    height
  );

  const format = options.outputFormat ?? "image/png";
  const quality =
    format === "image/jpeg"
      ? Math.min(Math.max(options.quality ?? 0.9, 0.1), 1.0)
      : undefined;
  try {
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        format,
        quality
      );
    });
  } finally {
    URL.revokeObjectURL(noiseUrl);
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
