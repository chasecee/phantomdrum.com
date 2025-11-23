#!/usr/bin/env node

import fs from "fs";
import path from "path";
import opentype from "opentype.js";
import { ShapeGeometry, ShapePath } from "three";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const CONFIG_TS_PATH = path.join(ROOT_DIR, "config", "cube-labels.ts");
const SENTENCE_PACKS_TS_PATH = path.join(
  ROOT_DIR,
  "config",
  "sentencePacks.generated.ts"
);
const LABEL_MODULE_DIR = path.join(
  ROOT_DIR,
  "app",
  "generated",
  "labelGeometries"
);

function loadConfig() {
  if (!fs.existsSync(CONFIG_TS_PATH)) {
    throw new Error(`Config not found at ${CONFIG_TS_PATH}`);
  }

  const tsContent = fs.readFileSync(CONFIG_TS_PATH, "utf-8");

  const fontPathMatch = tsContent.match(
    /export const fontPath = ["']([^"']+)["']/
  );
  const fontSizeMatch = tsContent.match(/export const fontSize = (\d+)/);
  const sentencePacksMatch = tsContent.match(
    /export const sentencePacks = (\[[\s\S]*?\]) as const/
  );
  const cubeLabelsMatch = tsContent.match(
    /export const cubeLabels = (\[[\s\S]*?\]) as const/
  );

  const fontPath = fontPathMatch
    ? fontPathMatch[1]
    : "assets/fonts/space-mono-v17-latin-700.ttf";
  const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 120;

  let sentencePacks = [];
  if (sentencePacksMatch) {
    try {
      sentencePacks = eval(sentencePacksMatch[1]);
    } catch (e) {
      throw new Error(
        `Failed to parse sentencePacks from ${CONFIG_TS_PATH}: ${e.message}`
      );
    }
  }

  let legacyCubeLabels = [];
  if (cubeLabelsMatch) {
    try {
      legacyCubeLabels = eval(cubeLabelsMatch[1]);
    } catch (e) {
      throw new Error(
        `Failed to parse cubeLabels from ${CONFIG_TS_PATH}: ${e.message}`
      );
    }
  }

  const sentenceLists = sentencePacks.flatMap((pack) =>
    Array.isArray(pack.lists) ? pack.lists : []
  );
  const flattenedSentences = sentenceLists.flat();

  const cubeLabels = Array.from(
    new Set(
      [...flattenedSentences, ...legacyCubeLabels].map((entry) =>
        typeof entry === "string" ? entry.trim() : ""
      )
    )
  ).filter(Boolean);

  if (cubeLabels.length === 0) {
    throw new Error(
      'Config must include at least one label via "sentencePacks"'
    );
  }

  return {
    fontPath: path.join(ROOT_DIR, fontPath),
    fontSize,
    cubeLabels,
    sentencePacks,
  };
}

function writeSentencePackModule(sentencePacks) {
  const header = `/**
 * Auto-generated from config/cube-labels.ts
 * Do not edit directly—edit cube-labels.ts and rerun generate-cube-labels.
 */
`;
  const content = `${header}export const sentencePacks = ${JSON.stringify(
    sentencePacks,
    null,
    2
  )} as const;

export type SentencePack = typeof sentencePacks[number];

export default sentencePacks;
`;
  fs.writeFileSync(SENTENCE_PACKS_TS_PATH, content, "utf-8");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<br\s*\/?>/gi, "-")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function prepareGlyphPath(font, text, fontSize) {
  const glyphPath = font.getPath(text, 0, 0, fontSize);
  const bbox = glyphPath.getBoundingBox();

  translatePath(glyphPath, -bbox.x1, -bbox.y1);

  return glyphPath;
}

function buildMultiLineGeometry(font, text, fontSize) {
  const lines = text
    .split(/<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  if (lines.length === 1) {
    return buildGeometryAsset(prepareGlyphPath(font, lines[0], fontSize));
  }

  const lineHeight = fontSize * 0.33;
  const lineGeometries = [];
  let maxWidth = 0;
  let totalHeight = (lines.length - 1) * lineHeight;

  lines.forEach((line, index) => {
    const glyphPath = prepareGlyphPath(font, line, fontSize);
    const asset = buildGeometryAsset(glyphPath);
    if (!asset) return;

    totalHeight += asset.height;
    lineGeometries.push({
      ...asset,
      yOffset: index * lineHeight,
    });
    maxWidth = Math.max(maxWidth, asset.width);
  });

  if (lineGeometries.length === 0) return null;

  const combinedPositions = [];
  const combinedUvs = [];
  const combinedIndices = [];
  let indexOffset = 0;
  let currentY = totalHeight / 2;

  lineGeometries.forEach((lineGeo) => {
    const positions = lineGeo.positions;
    const uvs = lineGeo.uvs;
    const indices = lineGeo.indices;

    const lineCenterY = currentY - lineGeo.height / 2;

    for (let i = 0; i < positions.length; i += 3) {
      combinedPositions.push(positions[i]);
      combinedPositions.push(positions[i + 1] + lineCenterY);
      combinedPositions.push(positions[i + 2]);
    }

    if (uvs) {
      for (let i = 0; i < uvs.length; i += 2) {
        combinedUvs.push(uvs[i]);
        combinedUvs.push(uvs[i + 1]);
      }
    }

    if (indices) {
      for (let i = 0; i < indices.length; i++) {
        combinedIndices.push(indices[i] + indexOffset);
      }
      indexOffset += positions.length / 3;
    }

    currentY -= lineGeo.height + lineHeight;
  });

  return {
    positions: combinedPositions,
    uvs: combinedUvs.length > 0 ? combinedUvs : undefined,
    indices: combinedIndices.length > 0 ? combinedIndices : undefined,
    indexType:
      combinedIndices.length > 0
        ? combinedIndices.length > 0 && Math.max(...combinedIndices) > 65535
          ? "Uint32Array"
          : "Uint16Array"
        : null,
    width: maxWidth,
    height: totalHeight,
  };
}

const FLOAT_PRECISION = 2;

function formatFloat(value) {
  const rounded = Number(value.toFixed(FLOAT_PRECISION));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function formatFloatArray(array) {
  return `[${Array.from(array, (num) => formatFloat(num)).join(",")}]`;
}

function formatIntArray(array) {
  return `[${Array.from(array).join(",")}]`;
}

const RESERVED_KEYWORDS = new Set([
  "super",
  "class",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "try",
  "catch",
  "finally",
  "throw",
  "new",
  "this",
  "typeof",
  "instanceof",
  "void",
  "delete",
  "in",
  "of",
  "with",
  "default",
  "export",
  "import",
  "from",
  "as",
  "let",
  "const",
  "var",
  "extends",
  "implements",
  "interface",
  "enum",
  "namespace",
  "module",
  "declare",
  "abstract",
  "async",
  "await",
  "yield",
  "static",
  "public",
  "private",
  "protected",
  "readonly",
  "get",
  "set",
  "constructor",
  "null",
  "undefined",
  "true",
  "false",
  "NaN",
  "Infinity",
]);

function slugToIdentifier(slug) {
  const base = slug.replace(/[^a-zA-Z0-9]/g, "_");
  const normalized = /^[0-9]/.test(base) ? `_${base}` : base;
  let identifier = normalized.replace(/_+([a-zA-Z0-9])/g, (_, char) =>
    char.toUpperCase()
  );
  if (RESERVED_KEYWORDS.has(identifier.toLowerCase())) {
    identifier = `_${identifier}`;
  }
  return identifier;
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
  geometry.translate(-(bbox.min.x + width / 2), -(bbox.min.y + height / 2), 0);
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

function generateGroup(font, labels, moduleDir, fontSize, exportName) {
  ensureCleanDir(moduleDir);
  const entries = [];
  labels.forEach((label) => {
    const slug = slugify(label);
    const asset = buildMultiLineGeometry(font, label, fontSize);
    if (!asset) return;
    writeModuleFile(moduleDir, slug, asset);
    entries.push({ slug, identifier: slugToIdentifier(slug) });
    console.log(
      `Generated geometry module ${path.relative(
        ROOT_DIR,
        path.join(moduleDir, `${slug}.ts`)
      )}`
    );
  });
  writeIndexFile(moduleDir, entries, exportName);
}

function main() {
  const config = loadConfig();
  if (!fs.existsSync(config.fontPath)) {
    throw new Error(`Font not found at ${config.fontPath}`);
  }

  const font = opentype.loadSync(config.fontPath);

  generateGroup(
    font,
    config.cubeLabels,
    LABEL_MODULE_DIR,
    config.fontSize,
    "labelGeometries"
  );

  writeSentencePackModule(config.sentencePacks);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
