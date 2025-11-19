const HALFTONE_DIRECTORY = "halftone";
const HALFTONE_FILENAME_PREFIX = "halftone";
const MAX_DECIMALS = 4;
const HALFTONE_SHAPES = ["circle", "square", "octagon", "hexagon", "triangle"];

function normalizeValue(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Halftone values must be finite numbers");
  }
  if (value <= 0) {
    throw new Error("Halftone values must be positive numbers");
  }
  const rounded = Number.parseFloat(value.toFixed(MAX_DECIMALS));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function encodeToken(value) {
  return value.toString().replace("-", "neg").replace(".", "p");
}

export function normalizeHalftoneValue(value) {
  return normalizeValue(value);
}

function normalizeShape(input) {
  if (typeof input !== "string" || input.trim().length === 0) {
    return HALFTONE_SHAPES[0];
  }
  const normalized = input.trim().toLowerCase();
  if (!HALFTONE_SHAPES.includes(normalized)) {
    throw new Error(
      `Invalid halftone shape "${input}". Valid shapes: ${HALFTONE_SHAPES.join(
        ", "
      )}`
    );
  }
  return normalized;
}

export function buildHalftoneKey(config) {
  const radius = normalizeValue(config.dotRadius);
  const spacing = normalizeValue(config.dotSpacing);
  const shape = normalizeShape(config.shape);
  return `${shape}-r${encodeToken(radius)}-s${encodeToken(spacing)}`;
}

export function computeHalftoneTileSize(dotSpacing, shapeInput) {
  const spacing = normalizeValue(dotSpacing);
  const shape = normalizeShape(shapeInput);
  if (shape === "square") {
    return Math.max(1, Math.round(spacing));
  }
  return Math.max(1, Math.round(spacing * Math.SQRT2));
}

export function buildHalftoneFilename(config) {
  return `${HALFTONE_FILENAME_PREFIX}-${buildHalftoneKey(config)}.svg`;
}

export function buildHalftonePublicPath(config) {
  return `/${HALFTONE_DIRECTORY}/${buildHalftoneFilename(config)}`;
}

export {
  HALFTONE_DIRECTORY,
  HALFTONE_FILENAME_PREFIX,
  HALFTONE_SHAPES,
};
