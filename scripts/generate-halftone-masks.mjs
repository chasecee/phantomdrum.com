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
import ts from "typescript";
import { fileURLToPath } from "node:url";
import {
  buildHalftoneFilename,
  HALFTONE_DIRECTORY,
  HALFTONE_FILENAME_PREFIX,
  normalizeHalftoneValue,
} from "../app/lib/halftoneAssetKey.js";

const TARGET_COMPONENT = "HalftoneEffect";
const DEFAULT_DOT_RADIUS = 2;
const DEFAULT_DOT_SPACING = 5;
const SUPPORTED_EXTENSIONS = new Set([".tsx", ".ts", ".jsx", ".js"]);
const SOURCE_DIRECTORIES = ["app"];
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  "public",
  ".turbo",
  ".output",
]);

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

function getScriptKind(extension) {
  switch (extension) {
    case ".ts":
      return ts.ScriptKind.TS;
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TSX;
  }
}

async function resolveSourceDirs() {
  const dirs = [];
  for (const relativeDir of SOURCE_DIRECTORIES) {
    const absolutePath = path.join(ROOT_DIR, relativeDir);
    if (await pathExists(absolutePath)) {
      dirs.push(absolutePath);
    }
  }
  return dirs;
}

async function collectSourceFiles(sourceDirs) {
  const files = [];
  for (const dir of sourceDirs) {
    await walkDirectory(dir, files);
  }
  return files;
}

async function walkDirectory(directory, results) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      await walkDirectory(fullPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        results.push(fullPath);
      }
    }
  }
}

function unwrapExpression(node) {
  let current = node;
  while (
    current &&
    (ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      (ts.isSatisfiesExpression && ts.isSatisfiesExpression(current)))
  ) {
    current = current.expression;
  }
  return current;
}

function evaluateNumericExpression(node, bindings) {
  if (!node) {
    return undefined;
  }
  const target = unwrapExpression(node);
  if (!target) {
    return undefined;
  }
  if (ts.isNumericLiteral(target)) {
    return Number(target.text);
  }
  if (ts.isPrefixUnaryExpression(target)) {
    const operand = evaluateNumericExpression(target.operand, bindings);
    if (typeof operand !== "number") {
      return undefined;
    }
    switch (target.operator) {
      case ts.SyntaxKind.PlusToken:
        return operand;
      case ts.SyntaxKind.MinusToken:
        return -operand;
      default:
        return undefined;
    }
  }
  if (ts.isBinaryExpression(target)) {
    const left = evaluateNumericExpression(target.left, bindings);
    const right = evaluateNumericExpression(target.right, bindings);
    if (typeof left !== "number" || typeof right !== "number") {
      return undefined;
    }
    switch (target.operatorToken.kind) {
      case ts.SyntaxKind.PlusToken:
        return left + right;
      case ts.SyntaxKind.MinusToken:
        return left - right;
      case ts.SyntaxKind.AsteriskToken:
        return left * right;
      case ts.SyntaxKind.SlashToken:
        return left / right;
      default:
        return undefined;
    }
  }
  if (ts.isIdentifier(target)) {
    return bindings.get(target.text);
  }
  return undefined;
}

function buildConstantBindings(sourceFile) {
  const bindings = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    if ((statement.declarationList.flags & ts.NodeFlags.Const) === 0) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        continue;
      }
      const value = evaluateNumericExpression(declaration.initializer, bindings);
      if (typeof value === "number") {
        bindings.set(declaration.name.text, value);
      }
    }
  }
  return bindings;
}

function isTargetElement(node) {
  const tagName = node.tagName;
  if (ts.isIdentifier(tagName)) {
    return tagName.escapedText === TARGET_COMPONENT;
  }
  if (ts.isJsxIdentifier && ts.isJsxIdentifier(tagName)) {
    return tagName.escapedText === TARGET_COMPONENT;
  }
  return false;
}

function extractAttributeValues(expression, attributeName, bindings, displayPath) {
  if (ts.isObjectLiteralExpression(expression)) {
    if (!expression.properties.length) {
      throw new Error(
        `[${displayPath}] ${attributeName} responsive object cannot be empty`
      );
    }
    const values = new Set();
    for (const property of expression.properties) {
      if (!ts.isPropertyAssignment(property)) {
        throw new Error(
          `[${displayPath}] ${attributeName} only accepts property assignments`
        );
      }
      const value = evaluateNumericExpression(property.initializer, bindings);
      if (typeof value !== "number") {
        throw new Error(
          `[${displayPath}] ${attributeName} responsive values must be numeric`
        );
      }
      values.add(value);
    }
    return Array.from(values);
  }
  const numeric = evaluateNumericExpression(expression, bindings);
  if (typeof numeric !== "number") {
    throw new Error(
      `[${displayPath}] ${attributeName} must resolve to a numeric literal`
    );
  }
  return [numeric];
}

function getAttributeValues(
  node,
  attributeName,
  fallback,
  bindings,
  displayPath
) {
  const properties = node.attributes?.properties ?? [];
  const attribute = properties.find(
    (prop) =>
      ts.isJsxAttribute(prop) && prop.name.escapedText === attributeName
  );
  if (!attribute) {
    return [fallback];
  }
  if (!attribute.initializer) {
    throw new Error(
      `[${displayPath}] ${attributeName} requires a value when specified`
    );
  }
  if (ts.isStringLiteral(attribute.initializer)) {
    const parsed = Number(attribute.initializer.text);
    if (Number.isNaN(parsed)) {
      throw new Error(`[${displayPath}] ${attributeName} must be numeric`);
    }
    return [parsed];
  }
  if (!ts.isJsxExpression(attribute.initializer)) {
    throw new Error(
      `[${displayPath}] ${attributeName} uses an unsupported initializer`
    );
  }
  const expression = unwrapExpression(attribute.initializer.expression);
  if (!expression) {
    throw new Error(
      `[${displayPath}] ${attributeName} expression cannot be empty`
    );
  }
  return extractAttributeValues(expression, attributeName, bindings, displayPath);
}

function addCombination(dotRadius, dotSpacing, displayPath, combos) {
  const normalizedRadius = normalizeHalftoneValue(dotRadius);
  const normalizedSpacing = normalizeHalftoneValue(dotSpacing);
  const key = `${normalizedRadius}__${normalizedSpacing}`;
  const source = displayPath ?? "<default>";
  const existing = combos.get(key);
  if (existing) {
    existing.files.add(source);
    return;
  }
  combos.set(key, {
    dotRadius: normalizedRadius,
    dotSpacing: normalizedSpacing,
    files: new Set([source]),
  });
}

function registerElement(node, combos, bindings, displayPath) {
  const radiusValues = getAttributeValues(
    node,
    "dotRadius",
    DEFAULT_DOT_RADIUS,
    bindings,
    displayPath
  );
  const spacingValues = getAttributeValues(
    node,
    "dotSpacing",
    DEFAULT_DOT_SPACING,
    bindings,
    displayPath
  );
  for (const radius of radiusValues) {
    for (const spacing of spacingValues) {
      addCombination(radius, spacing, displayPath, combos);
    }
  }
}

function registerElementsFromSource(sourceFile, filePath, combos, bindings) {
  let count = 0;
  const displayPath = path.relative(ROOT_DIR, filePath);
  function visit(node) {
    if (
      ts.isJsxSelfClosingElement(node) ||
      ts.isJsxOpeningElement(node)
    ) {
      if (isTargetElement(node)) {
        registerElement(node, combos, bindings, displayPath);
        count += 1;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return count;
}

function ensureDefaultCombination(combos) {
  addCombination(DEFAULT_DOT_RADIUS, DEFAULT_DOT_SPACING, null, combos);
}

async function collectCombinations(sourceFiles) {
  const combos = new Map();
  let usageCount = 0;
  for (const filePath of sourceFiles) {
    const code = await readFile(filePath, "utf-8");
    if (!code.includes(TARGET_COMPONENT)) {
      continue;
    }
    const kind = getScriptKind(path.extname(filePath).toLowerCase());
    const sourceFile = ts.createSourceFile(
      filePath,
      code,
      ts.ScriptTarget.ESNext,
      true,
      kind
    );
    const bindings = buildConstantBindings(sourceFile);
    usageCount += registerElementsFromSource(
      sourceFile,
      filePath,
      combos,
      bindings
    );
  }
  ensureDefaultCombination(combos);
  return { combos, usageCount };
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
  const sourceDirs = await resolveSourceDirs();
  if (!sourceDirs.length) {
    throw new Error("No source directories available for halftone analysis");
  }
  const sourceFiles = await collectSourceFiles(sourceDirs);
  if (!sourceFiles.length) {
    throw new Error("No source files found for halftone analysis");
  }
  const { combos, usageCount } = await collectCombinations(sourceFiles);
  const variants = sortCombinations(combos);
  console.log(
    `Detected ${usageCount} HalftoneEffect instance${
      usageCount === 1 ? "" : "s"
    } and ${variants.length} mask variant${variants.length === 1 ? "" : "s"}`
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

