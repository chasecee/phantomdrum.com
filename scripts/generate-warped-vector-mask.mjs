#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { optimize } from "svgo";
import { normalizeHalftoneValue } from "../app/lib/halftoneAssetKey.js";

const DEFAULTS = {
  width: 1000,
  height: 600,
  dotRadius: 1,
  dotSpacing: 3,
  warp: 1,
  crop: 0.22,
  maxCropRatio: 0.45,
  warpAxes: ["x", "y", "xy"],
  axis: "xy",
  name: "hero",
};
const MIN_WARP_STRENGTH = -0.999;
const WARP_FACTOR_EPSILON = 1e-6;

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

function clampCropRatio(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Crop ratio must be a finite number");
  }
  return Math.min(DEFAULTS.maxCropRatio, Math.max(0, value));
}

function normalizeWarpAxis(value) {
  if (typeof value !== "string") {
    return DEFAULTS.axis;
  }
  const normalized = value.trim().toLowerCase();
  if (!DEFAULTS.warpAxes.includes(normalized)) {
    throw new Error(
      `Invalid warp axis "${value}". Valid options: ${DEFAULTS.warpAxes.join(
        ", "
      )}`
    );
  }
  return normalized;
}

function warpPoint(x, y, width, height, warpStrength, axis) {
  const centerX = width / 2;
  const centerY = height / 2;
  const dx = x - centerX;
  const dy = y - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
  const norm = dist / maxRadius;
  const rawFactor = 1 + warpStrength * norm * norm;
  const factor = Math.max(rawFactor, WARP_FACTOR_EPSILON);
  const scaledDx = axis.includes("x") ? dx / factor : dx;
  const scaledDy = axis.includes("y") ? dy / factor : dy;
  return {
    x: centerX + scaledDx,
    y: centerY + scaledDy,
  };
}

function generateDots(
  width,
  height,
  dotRadius,
  dotSpacing,
  warpStrength,
  cropRatio,
  axis
) {
  const dots = [];
  const marginX = axis.includes("x") ? width * cropRatio : 0;
  const marginY = axis.includes("y") ? height * cropRatio : 0;
  const minX = marginX;
  const maxX = width - marginX;
  const minY = marginY;
  const maxY = height - marginY;
  for (let y = 0; y <= height; y += dotSpacing) {
    for (let x = 0; x <= width; x += dotSpacing) {
      const { x: warpedX, y: warpedY } = warpPoint(
        x,
        y,
        width,
        height,
        warpStrength,
        axis
      );
      if (
        warpedX < minX ||
        warpedX > maxX ||
        warpedY < minY ||
        warpedY > maxY
      ) {
        continue;
      }
      if (
        warpedX + dotRadius < 0 ||
        warpedX - dotRadius > width ||
        warpedY + dotRadius < 0 ||
        warpedY - dotRadius > height
      ) {
        continue;
      }
      dots.push({ cx: warpedX, cy: warpedY });
    }
  }
  return dots;
}

function formatNumber(value) {
  return Number.parseFloat(value.toFixed(0)).toString();
}

function remapDots(dots, width, height, cropRatio, axis) {
  if (cropRatio <= 0) {
    return { dots, scale: 1 };
  }
  const marginX = axis.includes("x") ? width * cropRatio : 0;
  const marginY = axis.includes("y") ? height * cropRatio : 0;
  const cropWidth = width - marginX * 2;
  const cropHeight = height - marginY * 2;
  if (cropWidth <= 0 || cropHeight <= 0) {
    return { dots, scale: 1 };
  }
  const offsetX = marginX;
  const offsetY = marginY;
  const scaleX = width / cropWidth;
  const scaleY = height / cropHeight;
  const mapped = dots.map(({ cx, cy }) => ({
    cx: (cx - offsetX) * scaleX,
    cy: (cy - offsetY) * scaleY,
  }));
  return { dots: mapped, scale: Math.min(scaleX, scaleY) };
}

function buildSvg(dots, width, height, dotRadius) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>`;
  const opening = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  const circles = dots
    .map(
      ({ cx, cy }) =>
        `<circle cx="${formatNumber(cx)}" cy="${formatNumber(
          cy
        )}" r="${formatNumber(dotRadius)}" fill="black"/>`
    )
    .join("");
  const closing = `</svg>`;
  return `${header}${opening}${circles}${closing}`;
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
  if (dotSpacing < dotRadius) {
    throw new Error("dotSpacing must be greater than or equal to dotRadius");
  }
  const warp = clampWarpStrength(Number(params.warp ?? DEFAULTS.warp));
  const cropRatio = clampCropRatio(Number(params.crop ?? DEFAULTS.crop));
  const axis = normalizeWarpAxis(params.axis ?? DEFAULTS.axis);
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error("Width and height must be integers");
  }
  const name = sanitizeName(params.name ?? DEFAULTS.name);

  const dots = generateDots(
    width,
    height,
    dotRadius,
    dotSpacing,
    warp,
    cropRatio,
    axis
  );
  const { dots: mappedDots, scale } = remapDots(
    dots,
    width,
    height,
    cropRatio,
    axis
  );
  const scaledRadius = dotRadius * scale;
  const svg = buildSvg(mappedDots, width, height, scaledRadius);

  const outputDir = path.join(
    process.cwd(),
    "public",
    "warped-halftone",
    "vector"
  );
  await mkdir(outputDir, { recursive: true });
  const fileName = `halftone-${name}.svg`;
  const filePath = path.join(outputDir, fileName);

  const optimized = optimize(svg, {
    path: filePath,
    floatPrecision: 1,
    multipass: true,
    plugins: [
      {
        name: "cleanupNumericValues",
        params: { floatPrecision: 1 },
      },
      { name: "convertShapeToPath", active: false },
    ],
  });
  if (optimized.error) {
    throw new Error(`SVGO failed: ${optimized.error}`);
  }
  await writeFile(filePath, optimized.data);
  console.log(
    `Generated warped vector mask at ${path.relative(process.cwd(), filePath)}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
