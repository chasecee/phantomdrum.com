#!/usr/bin/env node

import { createCanvas } from "canvas";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeHalftoneValue } from "../app/lib/halftoneAssetKey.js";

const DEFAULTS = {
  width: 1042,
  height: 600,
  dotRadius: 1.5,
  dotSpacing: 5,
  warp: 0.35,
  name: "hero",
};

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
      const factor = 1 + warpStrength * norm * norm;
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
  const warp = Math.max(0, Number(params.warp ?? DEFAULTS.warp));
  const name = sanitizeName(params.name ?? DEFAULTS.name);

  if (dotSpacing < dotRadius) {
    throw new Error("dotSpacing must be greater than or equal to dotRadius");
  }

  const baseCanvas = createCanvas(width, height);
  const ctx = baseCanvas.getContext("2d");
  const { canvas: tileCanvas } = createTileCanvas(dotRadius, dotSpacing);
  drawPattern(ctx, tileCanvas, width, height);

  const warped = warpPixels(ctx.getImageData(0, 0, width, height), width, height, warp);

  const outputDir = path.join(process.cwd(), "public", "warped-halftone");
  await mkdir(outputDir, { recursive: true });
  const fileName = `halftone-${name}.png`;
  const filePath = path.join(outputDir, fileName);
  await writeFile(filePath, warped.toBuffer("image/png"));
  console.log(`Generated warped mask at ${path.relative(process.cwd(), filePath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

