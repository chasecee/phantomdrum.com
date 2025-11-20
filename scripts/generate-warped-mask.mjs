#!/usr/bin/env node

import sharp from "sharp";
import { createCanvas } from "canvas";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeHalftoneValue } from "../app/lib/halftoneAssetKey.js";

const DEFAULT_OUTPUT_QUALITY = 0.3;
const OUTPUT_FORMAT = "webp";
const DEFAULT_CROP_RATIO = 0.2;
const MAX_CROP_RATIO = 0.45;
const DEFAULTS = {
  width: 1400,
  height: 1000,
  dotRadius: 1,
  dotSpacing: 4,
  warp: 0.25,
  crop: DEFAULT_CROP_RATIO,
  maxCropRatio: 0.45,
  quality: DEFAULT_OUTPUT_QUALITY,
  name: "hero",
};
const MIN_WARP_STRENGTH = -0.999;
const WARP_FACTOR_EPSILON = 1e-6;
const WEBP_EFFORT = 6;

function clampQuality(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Quality must be a finite number");
  }
  return Math.min(1, Math.max(0, value));
}

function sharpQuality(value) {
  return Math.max(1, Math.min(100, Math.round(value * 100)));
}

function clampCropRatio(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Crop ratio must be a finite number");
  }
  return Math.min(MAX_CROP_RATIO, Math.max(0, value));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (const arg of args) {
    const [rawKey, rawValue] = arg.split("=");
    if (!rawKey || rawValue === undefined) continue;
    const key = rawKey.replace(/^--?/, "");
    params[key] = rawValue;
  }
  return params;
}

function sanitizeName(value) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-");
}

function clampWarpStrength(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Warp strength must be a finite number");
  }
  return Math.max(MIN_WARP_STRENGTH, value);
}

function createTileCanvas(dotRadius, dotSpacing) {
  const size = Math.max(1, Math.round(dotSpacing * Math.SQRT2));
  const half = size / 2;
  const radius = normalizeHalftoneValue(dotRadius);
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.beginPath();
  [
    { cx: half, cy: 0 },
    { cx: 0, cy: half },
    { cx: size, cy: half },
    { cx: half, cy: size },
  ].forEach(({ cx, cy }) => {
    ctx.moveTo(cx + radius, cy);
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  });
  ctx.fill();
  return { canvas, size };
}

function drawPattern(ctx, tileCanvas, width, height) {
  const pattern = ctx.createPattern(tileCanvas, "repeat");
  if (!pattern) {
    throw new Error("Unable to build halftone pattern");
  }
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
}

function warpPixels(source, width, height, warpStrength) {
  const outputCanvas = createCanvas(width, height);
  const outputCtx = outputCanvas.getContext("2d");
  const srcData = source.data;
  const dstImage = outputCtx.createImageData(width, height);
  const dstData = dstImage.data;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const norm = dist / maxRadius;
      const rawFactor = 1 + warpStrength * norm * norm;
      const factor = Math.max(rawFactor, WARP_FACTOR_EPSILON);
      const sampleX = Math.min(
        width - 1,
        Math.max(0, Math.round(centerX + dx / factor))
      );
      const sampleY = Math.min(
        height - 1,
        Math.max(0, Math.round(centerY + dy / factor))
      );
      const srcIdx = (sampleY * width + sampleX) * 4;
      const dstIdx = (y * width + x) * 4;
      dstData[dstIdx] = srcData[srcIdx];
      dstData[dstIdx + 1] = srcData[srcIdx + 1];
      dstData[dstIdx + 2] = srcData[srcIdx + 2];
      dstData[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }

  outputCtx.putImageData(dstImage, 0, 0);
  return outputCanvas;
}

async function main() {
  const params = parseArgs();
  const width = Number(params.width ?? DEFAULTS.width);
  const height = Number(params.height ?? DEFAULTS.height);
  const dotRadius = normalizeHalftoneValue(
    Number(params.dotRadius ?? DEFAULTS.dotRadius)
  );
  const dotSpacing = normalizeHalftoneValue(
    Number(params.dotSpacing ?? DEFAULTS.dotSpacing)
  );
  const warp = clampWarpStrength(Number(params.warp ?? DEFAULTS.warp));
  const quality = clampQuality(Number(params.quality ?? DEFAULTS.quality));
  const cropRatio = clampCropRatio(Number(params.crop ?? DEFAULTS.crop));
  const name = sanitizeName(params.name ?? DEFAULTS.name);

  if (dotSpacing < dotRadius) {
    throw new Error("dotSpacing must be greater than or equal to dotRadius");
  }

  const baseCanvas = createCanvas(width, height);
  const ctx = baseCanvas.getContext("2d");
  const { canvas: tileCanvas } = createTileCanvas(dotRadius, dotSpacing);
  drawPattern(ctx, tileCanvas, width, height);

  const warped = warpPixels(
    ctx.getImageData(0, 0, width, height),
    width,
    height,
    warp
  );

  const outputDir = path.join(process.cwd(), "public", "warped-halftone");
  await mkdir(outputDir, { recursive: true });
  const fileName = `halftone-${name}.${OUTPUT_FORMAT}`;
  const filePath = path.join(outputDir, fileName);
  const pngBuffer = warped.toBuffer("image/png");
  const cropWidth = Math.max(1, Math.round(width * (1 - cropRatio * 2)));
  const cropHeight = Math.max(1, Math.round(height * (1 - cropRatio * 2)));
  const left = Math.round((width - cropWidth) / 2);
  const top = Math.round((height - cropHeight) / 2);
  let processor = sharp(pngBuffer);
  if (cropRatio > 0) {
    processor = processor.extract({
      left,
      top,
      width: cropWidth,
      height: cropHeight,
    });
  }
  const webpBuffer = await processor
    .resize(width, height, { fit: "fill" })
    .webp({ quality: sharpQuality(quality), effort: WEBP_EFFORT })
    .toBuffer();
  await writeFile(filePath, webpBuffer);
  console.log(
    `Generated warped mask at ${path.relative(process.cwd(), filePath)}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
