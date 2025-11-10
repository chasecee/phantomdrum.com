#!/usr/bin/env node

import fs from "fs";
import path from "path";
import opentype from "opentype.js";
import { ShapeGeometry, ShapePath } from "three";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT_DIR, "config", "cube-labels.json");
const OUTPUT_DIR = path.join(ROOT_DIR, "public", "generated");
const LABEL_MODULE_DIR = path.join(
  ROOT_DIR,
  "app",
  "generated",
  "labelGeometries"
);
const BUTTON_MODULE_DIR = path.join(
  ROOT_DIR,
  "app",
  "generated",
  "buttonLabelGeometries"
);

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config not found at ${CONFIG_PATH}`);
  }

  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data.cubeLabels) || data.cubeLabels.length === 0) {
    throw new Error('Config must include a non-empty "cubeLabels" array');
  }

  if (!data.fontPath) {
    throw new Error("Config must include \"fontPath\"");
  }

  return {
    fontPath: path.join(ROOT_DIR, data.fontPath),
    fontSize: typeof data.fontSize === "number" ? data.fontSize : 120,
    cubeLabels: data.cubeLabels,
    buttonLabels: Array.isArray(data.buttonLabels) ? data.buttonLabels : [],
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

function ensureCleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
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

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${text}">
  <path d="${pathData}" fill="#000000" />
</svg>
`;

  return { svgContent, glyphPath };
}

function formatFloat(value) {
  const rounded = Number(value.toFixed(6));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function formatFloatArray(array) {
  return `[${Array.from(array, (num) => formatFloat(num)).join(",")}]`;
}

function formatIntArray(array) {
  return `[${Array.from(array).join(",")}]`;
}

function slugToIdentifier(slug) {
  const base = slug.replace(/[^a-zA-Z0-9]/g, "_");
  const normalized = /^[0-9]/.test(base) ? `_${base}` : base;
  return normalized.replace(/_+([a-zA-Z0-9])/g, (_, char) =>
    char.toUpperCase()
  );
}

function buildGeometryAsset(glyphPath) {
  const shapePath = new ShapePath();
  glyphPath.commands.forEach((cmd) => {
    switch (cmd.type) {
      case "M":
        shapePath.moveTo(cmd.x, cmd.y);
        break;
      case "L":
        shapePath.lineTo(cmd.x, cmd.y);
        break;
      case "C":
        shapePath.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        break;
      case "Q":
        shapePath.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
        break;
      case "Z":
        if (shapePath.currentPath) {
          shapePath.currentPath.autoClose = true;
          shapePath.currentPath.closePath();
        }
        break;
      default:
        break;
    }
  });
  const shapes = shapePath.toShapes(true);
  if (!shapes.length) return null;
  const geometry = new ShapeGeometry(shapes);
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  if (!bbox) {
    geometry.dispose();
    return null;
  }
  const width = bbox.max.x - bbox.min.x;
  const height = bbox.max.y - bbox.min.y;
  geometry.translate(
    -(bbox.min.x + width / 2),
    -(bbox.min.y + height / 2),
    0
  );
  geometry.scale(1, -1, 1);
  geometry.computeBoundingSphere();
  const positionAttr = geometry.getAttribute("position");
  const uvAttr = geometry.getAttribute("uv");
  const indexAttr = geometry.getIndex();
  const positions = positionAttr ? positionAttr.array.slice() : [];
  const uvs = uvAttr ? uvAttr.array.slice() : [];
  const indices = indexAttr ? indexAttr.array.slice() : null;
  const indexType = indexAttr ? indexAttr.array.constructor.name : null;
  geometry.dispose();
  return { positions, uvs, indices, indexType, width, height };
}

function writeModuleFile(moduleDir, slug, asset) {
  const positions = formatFloatArray(asset.positions);
  const uvs = formatFloatArray(asset.uvs);
  const indexData =
    asset.indices && asset.indexType
      ? {
          type: asset.indexType,
          values: formatIntArray(asset.indices),
        }
      : null;
const moduleContent = `export const positions = new Float32Array(${positions});
export const uvs = new Float32Array(${uvs});
${
  indexData
    ? `export const indices = new ${indexData.type}(${indexData.values});\n`
    : "export const indices = undefined;\n"
}export const width = ${formatFloat(asset.width)};
export const height = ${formatFloat(asset.height)};
`;
  fs.writeFileSync(path.join(moduleDir, `${slug}.ts`), moduleContent, "utf-8");
}

function writeIndexFile(moduleDir, entries, exportName) {
  if (entries.length === 0) {
    const emptyContent = `export const ${exportName} = {};

export default ${exportName};
`;
    fs.writeFileSync(path.join(moduleDir, "index.ts"), emptyContent, "utf-8");
    return;
  }
  const imports = entries
    .map(
      ({ slug, identifier }) => `import * as ${identifier} from "./${slug}";`
    )
    .join("\n");
  const mapBody = entries
    .map(
      ({ slug, identifier }) =>
        `"${slug}": { positions: ${identifier}.positions, uvs: ${identifier}.uvs, indices: ${identifier}.indices, width: ${identifier}.width, height: ${identifier}.height }`
    )
    .join(",\n  ");
  const content = `${imports}

export const ${exportName} = {
  ${mapBody}
};

export default ${exportName};
`;
  fs.writeFileSync(path.join(moduleDir, "index.ts"), content, "utf-8");
}

function generateGroup(
  font,
  labels,
  groupDir,
  moduleDir,
  fontSize,
  exportName
) {
  ensureDir(groupDir);
  ensureCleanDir(moduleDir);
  const entries = [];
  labels.forEach((label) => {
    const slug = slugify(label);
    const { svgContent, glyphPath } = generateSvgForLabel(
      font,
      label,
      fontSize
    );
    const outputPath = path.join(groupDir, `${slug}.svg`);
    fs.writeFileSync(outputPath, svgContent, "utf-8");
    console.log(`Generated ${path.relative(ROOT_DIR, outputPath)}`);
    const asset = buildGeometryAsset(glyphPath);
    if (!asset) return;
    writeModuleFile(moduleDir, slug, asset);
    entries.push({ slug, identifier: slugToIdentifier(slug) });
  });
  writeIndexFile(moduleDir, entries, exportName);
}

function main() {
  const config = loadConfig();
  if (!fs.existsSync(config.fontPath)) {
    throw new Error(`Font not found at ${config.fontPath}`);
  }

  const font = opentype.loadSync(config.fontPath);

  const cubeDir = path.join(OUTPUT_DIR, "cube-labels");
  generateGroup(
    font,
    config.cubeLabels,
    cubeDir,
    LABEL_MODULE_DIR,
    config.fontSize,
    "labelGeometries"
  );

  if (config.buttonLabels.length > 0) {
    const buttonDir = path.join(OUTPUT_DIR, "button-labels");
    generateGroup(
      font,
      config.buttonLabels,
      buttonDir,
      BUTTON_MODULE_DIR,
      config.fontSize,
      "buttonLabelGeometries"
    );
  } else {
    ensureCleanDir(BUTTON_MODULE_DIR);
    writeIndexFile(BUTTON_MODULE_DIR, [], "buttonLabelGeometries");
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
