#!/usr/bin/env node

import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  HALFTONE_SHAPES,
  buildHalftoneKey,
  normalizeHalftoneValue,
  computeHalftoneTileSize,
} from "../app/lib/halftoneAssetKey.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const HALFTONE_DIR = path.join(PUBLIC_DIR, "halftone");
const TARGET_SHAPES =
  HALFTONE_SHAPES.length > 0 ? [...HALFTONE_SHAPES] : ["circle"];

function addCombination(dotRadius, dotSpacing, combos) {
  const radius = normalizeHalftoneValue(dotRadius);
  const spacing = normalizeHalftoneValue(dotSpacing);
  const key = `${radius}__${spacing}`;
  if (combos.has(key)) {
    return;
  }
  combos.set(key, { dotRadius: radius, dotSpacing: spacing });
}

function formatNumber(value, decimals = 4) {
  return Number.parseFloat(value.toFixed(decimals));
}

function renderShape(shape, cx, cy, radius) {
  const centerX = formatNumber(cx);
  const centerY = formatNumber(cy);
  switch (shape) {
    case "circle":
      return `<circle cx="${centerX}" cy="${centerY}" r="${formatNumber(
        radius
      )}" fill="black"/>`;
    case "square":
      return renderRegularPolygon("square", centerX, centerY, radius, 4);
    case "octagon":
      return renderRegularPolygon("octagon", centerX, centerY, radius, 8);
    case "hexagon":
      return renderRegularPolygon("hexagon", centerX, centerY, radius, 6);
    case "triangle":
      return renderRegularPolygon("triangle", centerX, centerY, radius, 3);
    default:
      throw new Error(`Unsupported halftone shape "${shape}"`);
  }
}

function renderRegularPolygon(id, cx, cy, radius, sides) {
  const rotation =
    id === "square" || id === "octagon" ? -Math.PI / 4 : -Math.PI / 2;
  const points = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (i * 2 * Math.PI) / sides;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${formatNumber(x)} ${formatNumber(y)}`);
  }
  return `<polygon points="${points.join(" ")}" fill="black"/>`;
}

function createTile(dotRadius, dotSpacing, shape) {
  const size = computeHalftoneTileSize(dotSpacing, shape);
  const radiusValue = formatNumber(dotRadius);
  let dots;
  if (shape === "square") {
    const half = size / 2;
    dots = [{ cx: half, cy: half }];
  } else {
    const half = size / 2;
    dots = [
      { cx: half, cy: 0 },
      { cx: 0, cy: half },
      { cx: size, cy: half },
      { cx: half, cy: size },
    ];
  }
  const shapes = dots
    .map(({ cx, cy }) => renderShape(shape, cx, cy, radiusValue))
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">${shapes}</svg>`;
  return { size, svg };
}

function buildBaseVariants() {
  const combos = new Map();
  const values = [];
  for (let value = 1; value <= 10; value += 0.5) {
    values.push(value);
  }
  for (const radius of values) {
    for (const spacing of values) {
      if (spacing >= radius) {
        addCombination(radius, spacing, combos);
      }
    }
  }
  return Array.from(combos.values()).sort((a, b) => {
    if (a.dotRadius !== b.dotRadius) {
      return a.dotRadius - b.dotRadius;
    }
    return a.dotSpacing - b.dotSpacing;
  });
}

function expandVariantsForShapes(baseVariants, shapes) {
  const variants = [];
  for (const shape of shapes) {
    for (const variant of baseVariants) {
      variants.push({ ...variant, shape });
    }
  }
  return variants;
}

export async function generateHalftoneMasks() {
  const baseVariants = buildBaseVariants();
  const variants = expandVariantsForShapes(baseVariants, TARGET_SHAPES);

  await rm(HALFTONE_DIR, { recursive: true, force: true });
  await mkdir(HALFTONE_DIR, { recursive: true });

  console.log(
    `Generating ${variants.length} halftone SVG tiles for shapes: ${TARGET_SHAPES.join(
      ", "
    )}`
  );
  for (const variant of variants) {
    const { svg } = createTile(
      variant.dotRadius,
      variant.dotSpacing,
      variant.shape
    );
    const key = buildHalftoneKey(variant);
    const filePath = path.join(HALFTONE_DIR, `halftone-${key}.svg`);
    await writeFile(filePath, svg, "utf-8");
  }
}

function isDirectExecution() {
  const invoked = process.argv[1];
  if (!invoked) {
    return false;
  }
  try {
    return pathToFileURL(path.resolve(invoked)).href === import.meta.url;
  } catch {
    return false;
  }
}

if (isDirectExecution()) {
  try {
    await generateHalftoneMasks();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
