const HALFTONE_DIRECTORY = "halftone";
const HALFTONE_FILENAME_PREFIX = "halftone";
const MAX_DECIMALS = 4;

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

export function buildHalftoneKey(config) {
  const radius = normalizeValue(config.dotRadius);
  const spacing = normalizeValue(config.dotSpacing);
  return `r${encodeToken(radius)}-s${encodeToken(spacing)}`;
}

export function buildHalftoneFilename(config) {
  return `${HALFTONE_FILENAME_PREFIX}-${buildHalftoneKey(config)}.svg`;
}

export function buildHalftonePublicPath(config) {
  return `/${HALFTONE_DIRECTORY}/${buildHalftoneFilename(config)}`;
}

export { HALFTONE_DIRECTORY, HALFTONE_FILENAME_PREFIX };

