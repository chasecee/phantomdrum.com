#!/usr/bin/env node

import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildHalftoneKey,
  normalizeHalftoneValue,
} from "../app/lib/halftoneAssetKey.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const HALFTONE_DIR = path.join(PUBLIC_DIR, "halftone");
const MAP_MODULE_PATH = path.join(
  ROOT_DIR,
  "app",
  "generated",
  "halftoneMap.ts"
);

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

function createTile(dotRadius, dotSpacing) {
  const size = Math.max(1, Math.round(dotSpacing * Math.SQRT2));
  const half = size / 2;
  const radiusValue = formatNumber(dotRadius);
  const circles = [
    { cx: half, cy: 0 },
    { cx: 0, cy: half },
    { cx: size, cy: half },
    { cx: half, cy: size },
  ]
    .map(
      ({ cx, cy }) =>
        `<circle cx="${formatNumber(cx)}" cy="${formatNumber(
          cy
        )}" r="${radiusValue}" fill="black"/>`
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">${circles}</svg>`;
  return { size, svg };
}

async function writeFileIfChanged(filePath, content) {
  try {
    const existing = await readFile(filePath, "utf-8");
    if (existing === content) {
      return false;
    }
  } catch (error) {
    if (!(error && error.code === "ENOENT")) {
      throw error;
    }
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf-8");
  return true;
}

function createMapModule(variants) {
  const payload = {};
  for (const variant of variants) {
    const key = buildHalftoneKey(variant);
    payload[key] = {
      size: variant.size,
    };
  }
  const serialized = JSON.stringify(payload, null, 2);
  return `export const halftoneMap = ${serialized} as const;

export type HalftoneKey = keyof typeof halftoneMap;
export type HalftoneTileMeta = typeof halftoneMap[HalftoneKey];
`;
}

async function main() {
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
  const variants = Array.from(combos.values()).sort((a, b) => {
    if (a.dotRadius !== b.dotRadius) {
      return a.dotRadius - b.dotRadius;
    }
    return a.dotSpacing - b.dotSpacing;
  });

  await rm(HALFTONE_DIR, { recursive: true, force: true });
  await mkdir(HALFTONE_DIR, { recursive: true });

  console.log(`Generating ${variants.length} halftone SVG tiles`);
  for (const variant of variants) {
    const { svg, size } = createTile(variant.dotRadius, variant.dotSpacing);
    variant.size = size;
    const key = buildHalftoneKey(variant);
    const filePath = path.join(HALFTONE_DIR, `halftone-${key}.svg`);
    await writeFile(filePath, svg, "utf-8");
  }

  console.log("Generating halftone map module");
  const mapModule = createMapModule(variants);
  const updated = await writeFileIfChanged(MAP_MODULE_PATH, mapModule);
  if (updated) {
    console.log(`Generated ${path.relative(ROOT_DIR, MAP_MODULE_PATH)}`);
  } else {
    console.log("Halftone map unchanged");
  }
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}


