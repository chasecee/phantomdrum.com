#!/usr/bin/env node

import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildHalftoneFilename,
  HALFTONE_DIRECTORY,
  HALFTONE_FILENAME_PREFIX,
  normalizeHalftoneValue,
} from "../app/lib/halftoneAssetKey.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const OUTPUT_DIR = path.join(PUBLIC_DIR, HALFTONE_DIRECTORY);

async function pathExists(target) {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function addCombination(dotRadius, dotSpacing, combos) {
  const normalizedRadius = normalizeHalftoneValue(dotRadius);
  const normalizedSpacing = normalizeHalftoneValue(dotSpacing);
  const key = `${normalizedRadius}__${normalizedSpacing}`;
  if (combos.has(key)) {
    return;
  }
  combos.set(key, {
    dotRadius: normalizedRadius,
    dotSpacing: normalizedSpacing,
  });
}

async function ensureOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true });
}

async function purgeObsoleteFiles(validFilenames) {
  if (!(await pathExists(OUTPUT_DIR))) {
    return;
  }
  const entries = await readdir(OUTPUT_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (
      !entry.isFile() ||
      !entry.name.endsWith(".svg") ||
      !entry.name.startsWith(`${HALFTONE_FILENAME_PREFIX}-`)
    ) {
      continue;
    }
    if (validFilenames.has(entry.name)) {
      continue;
    }
    const targetPath = path.join(OUTPUT_DIR, entry.name);
    await rm(targetPath);
    console.log(`Removed stale ${path.relative(ROOT_DIR, targetPath)}`);
  }
}

function formatNumber(value, decimals) {
  return Number.parseFloat(value.toFixed(decimals));
}

function createSvgContent(dotRadius, dotSpacing) {
  const radiusValue = formatNumber(dotRadius, 4);
  const spacingValue = formatNumber(dotSpacing, 4);
  const patternSize = formatNumber(spacingValue * Math.SQRT2, 6);
  const halfPattern = formatNumber(patternSize / 2, 6);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${patternSize}" height="${patternSize}" viewBox="0 0 ${patternSize} ${patternSize}"><defs><pattern id="dots" x="0" y="0" width="${patternSize}" height="${patternSize}" patternUnits="userSpaceOnUse"><circle cx="${halfPattern}" cy="0" r="${radiusValue}" fill="black"/><circle cx="0" cy="${halfPattern}" r="${radiusValue}" fill="black"/><circle cx="${patternSize}" cy="${halfPattern}" r="${radiusValue}" fill="black"/><circle cx="${halfPattern}" cy="${patternSize}" r="${radiusValue}" fill="black"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/></svg>\n`;
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
  await writeFile(filePath, content, "utf-8");
  return true;
}

async function writeMaskAsset(config) {
  const filename = buildHalftoneFilename(config);
  const assetPath = path.join(OUTPUT_DIR, filename);
  const content = createSvgContent(config.dotRadius, config.dotSpacing);
  const updated = await writeFileIfChanged(assetPath, content);
  if (updated) {
    console.log(`Generated ${path.relative(ROOT_DIR, assetPath)}`);
  }
}

function sortCombinations(combos) {
  return Array.from(combos.values()).sort((a, b) => {
    if (a.dotRadius !== b.dotRadius) {
      return a.dotRadius - b.dotRadius;
    }
    if (a.dotSpacing !== b.dotSpacing) {
      return a.dotSpacing - b.dotSpacing;
    }
    return 0;
  });
}

async function main() {
  const combos = new Map();
  const values = [];
  for (let i = 1; i <= 8; i++) {
    values.push(i);
    values.push(i + 0.5);
  }
  for (const radius of values) {
    for (const spacing of values) {
      addCombination(radius, spacing, combos);
    }
  }
  const variants = sortCombinations(combos);
  console.log(
    `Generating ${variants.length} mask variant${
      variants.length === 1 ? "" : "s"
    }`
  );
  await ensureOutputDir();
  const filenames = new Set(
    variants.map((config) => buildHalftoneFilename(config))
  );
  await purgeObsoleteFiles(filenames);
  for (const config of variants) {
    await writeMaskAsset(config);
  }
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
