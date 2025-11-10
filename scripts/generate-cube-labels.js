#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT_DIR, "config", "cube-labels.json");
const OUTPUT_DIR = path.join(ROOT_DIR, "public", "generated", "cube-labels");

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config not found at ${CONFIG_PATH}`);
  }

  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data.labels) || data.labels.length === 0) {
    throw new Error("Config must include a non-empty \"labels\" array");
  }

  if (!data.fontPath) {
    throw new Error("Config must include \"fontPath\"");
  }

  return {
    fontPath: path.join(ROOT_DIR, data.fontPath),
    fontSize: typeof data.fontSize === "number" ? data.fontSize : 120,
    labels: data.labels,
  };
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function translatePath(pathData, dx, dy) {
  pathData.commands.forEach((cmd) => {
    if (cmd.x !== undefined) cmd.x += dx;
    if (cmd.y !== undefined) cmd.y += dy;
    if (cmd.x1 !== undefined) cmd.x1 += dx;
    if (cmd.y1 !== undefined) cmd.y1 += dy;
    if (cmd.x2 !== undefined) cmd.x2 += dx;
    if (cmd.y2 !== undefined) cmd.y2 += dy;
  });
}

function generateSvgForLabel(font, text, fontSize) {
  const glyphPath = font.getPath(text, 0, 0, fontSize);
  const bbox = glyphPath.getBoundingBox();

  const width = bbox.x2 - bbox.x1 || fontSize;
  const height = bbox.y2 - bbox.y1 || fontSize;

  translatePath(glyphPath, -bbox.x1, -bbox.y1);

  const pathData = glyphPath.toPathData(3);
  const viewBox = `0 0 ${width.toFixed(2)} ${height.toFixed(2)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${text}">
  <path d="${pathData}" fill="#000000" />
</svg>
`;
}

function main() {
  const config = loadConfig();
  ensureDir(OUTPUT_DIR);

  if (!fs.existsSync(config.fontPath)) {
    throw new Error(`Font not found at ${config.fontPath}`);
  }

  const font = opentype.loadSync(config.fontPath);

  config.labels.forEach((label) => {
    const slug = slugify(label);
    const svgContent = generateSvgForLabel(font, label, config.fontSize);
    const outputPath = path.join(OUTPUT_DIR, `${slug}.svg`);
    fs.writeFileSync(outputPath, svgContent, "utf-8");
    console.log(`Generated ${path.relative(ROOT_DIR, outputPath)}`);
  });
}

main();

