#!/usr/bin/env node

import sharp from "sharp";
import { createCanvas } from "canvas";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeHalftoneValue } from "../app/lib/halftoneAssetKey.js";

const DEFAULT_OUTPUT_QUALITY = 0.35;
const OUTPUT_FORMAT = "webp";
const DEFAULT_CROP_RATIO = 0.1;
const MAX_CROP_RATIO = 0.45;
const DEFAULTS = {
  width: 1080,
  height: 1080,
  startDotRadius: 1,
  startDotSpacing: 4,
  endDotRadius: 3,
  endDotSpacing: 8,
  direction: "top-to-bottom",
  crop: DEFAULT_CROP_RATIO,
  quality: DEFAULT_OUTPUT_QUALITY,
  name: "gradient",
};
const WEBP_EFFORT = 5;
const DIRECTIONS = ["top-to-bottom", "bottom-to-top", "left-to-right", "right-to-left"];

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

function validateDirection(value) {
  if (!DIRECTIONS.includes(value)) {
    throw new Error(
      `Invalid direction "${value}". Valid directions: ${DIRECTIONS.join(", ")}`
    );
  }
  return value;
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function getGradientProgress(x, y, width, height, direction) {
  switch (direction) {
    case "top-to-bottom":
      return y / height;
    case "bottom-to-top":
      return 1 - y / height;
    case "left-to-right":
      return x / width;
    case "right-to-left":
      return 1 - x / width;
    default:
      return y / height;
  }
}

function drawGradientPattern(
  ctx,
  width,
  height,
  startDotRadius,
  startDotSpacing,
  endDotRadius,
  endDotSpacing,
  direction
) {
  ctx.fillStyle = "black";
  const minSpacing = Math.min(startDotSpacing, endDotSpacing);
  const maxSpacing = Math.max(startDotSpacing, endDotSpacing);
  const drawnDots = new Set();

  const isVertical = direction === "top-to-bottom" || direction === "bottom-to-top";
  const primaryDim = isVertical ? height : width;
  const secondaryDim = isVertical ? width : height;

  for (let i = -maxSpacing; i <= primaryDim + maxSpacing; i += minSpacing / 4) {
    const progress = isVertical 
      ? getGradientProgress(secondaryDim / 2, i, secondaryDim, primaryDim, direction)
      : getGradientProgress(i, primaryDim / 2, primaryDim, secondaryDim, direction);
    const clampedProgress = Math.min(1, Math.max(0, progress));
    const localSpacing = normalizeHalftoneValue(
      lerp(startDotSpacing, endDotSpacing, clampedProgress)
    );

    const gridStart = Math.floor(-maxSpacing / localSpacing) * localSpacing;
    const gridEnd = Math.ceil((secondaryDim + maxSpacing) / localSpacing) * localSpacing;

    for (let j = gridStart; j <= gridEnd; j += localSpacing) {
      const x = isVertical ? j : i;
      const y = isVertical ? i : j;

      const dotProgress = getGradientProgress(x, y, width, height, direction);
      const clampedDotProgress = Math.min(1, Math.max(0, dotProgress));
      const dotRadius = normalizeHalftoneValue(
        lerp(startDotRadius, endDotRadius, clampedDotProgress)
      );

      const dotKey = `${Math.round(x * 1000)},${Math.round(y * 1000)}`;
      if (drawnDots.has(dotKey) || dotRadius <= 0) {
        continue;
      }

      if (x >= -dotRadius && x <= width + dotRadius &&
          y >= -dotRadius && y <= height + dotRadius) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        drawnDots.add(dotKey);
      }
    }
  }
}

async function main() {
  const params = parseArgs();
  const width = Number(params.width ?? DEFAULTS.width);
  const height = Number(params.height ?? DEFAULTS.height);
  const startDotRadius = normalizeHalftoneValue(
    Number(params.startDotRadius ?? DEFAULTS.startDotRadius)
  );
  const startDotSpacing = normalizeHalftoneValue(
    Number(params.startDotSpacing ?? DEFAULTS.startDotSpacing)
  );
  const endDotRadius = normalizeHalftoneValue(
    Number(params.endDotRadius ?? DEFAULTS.endDotRadius)
  );
  const endDotSpacing = normalizeHalftoneValue(
    Number(params.endDotSpacing ?? DEFAULTS.endDotSpacing)
  );
  const direction = validateDirection(
    params.direction ?? DEFAULTS.direction
  );
  const quality = clampQuality(Number(params.quality ?? DEFAULTS.quality));
  const cropRatio = clampCropRatio(Number(params.crop ?? DEFAULTS.crop));
  const name = sanitizeName(params.name ?? DEFAULTS.name);

  if (startDotSpacing < startDotRadius) {
    throw new Error(
      "startDotSpacing must be greater than or equal to startDotRadius"
    );
  }
  if (endDotSpacing < endDotRadius) {
    throw new Error("endDotSpacing must be greater than or equal to endDotRadius");
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  drawGradientPattern(
    ctx,
    width,
    height,
    startDotRadius,
    startDotSpacing,
    endDotRadius,
    endDotSpacing,
    direction
  );

  const outputDir = path.join(process.cwd(), "public", "warped-halftone");
  await mkdir(outputDir, { recursive: true });
  const fileName = `halftone-${name}.${OUTPUT_FORMAT}`;
  const filePath = path.join(outputDir, fileName);
  const pngBuffer = canvas.toBuffer("image/png");
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
    `Generated gradient mask at ${path.relative(process.cwd(), filePath)}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

