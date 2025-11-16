import type {
  AspectRatioInput,
  HalftoneParamsPreset,
  HalftoneSectionConfig,
  HalftoneSectionConfigInput,
  ResolvedAspectRatio,
  ScrollTriggerSettings,
} from "../halftoneTypes";

const DEFAULT_ASPECT_RATIO_BASE = { width: 1, height: 1.5 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const sanitizeDimension = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const createAspectRatioValue = (
  width: number,
  height: number
): ResolvedAspectRatio => {
  const resolvedWidth = sanitizeDimension(
    width,
    DEFAULT_ASPECT_RATIO_BASE.width
  );
  const resolvedHeight = sanitizeDimension(
    height,
    DEFAULT_ASPECT_RATIO_BASE.height
  );
  const scalar = resolvedHeight / resolvedWidth;
  return {
    width: resolvedWidth,
    height: resolvedHeight,
    scalar,
    css: `${resolvedWidth}/${resolvedHeight}`,
  };
};

const DEFAULT_ASPECT_RATIO = createAspectRatioValue(
  DEFAULT_ASPECT_RATIO_BASE.width,
  DEFAULT_ASPECT_RATIO_BASE.height
);

const DEFAULT_INITIAL_PARAMS: HalftoneParamsPreset = {
  halftoneSize: "10%",
  dotSpacing: ".35%",
  rgbOffset: "5%",
  rgbOffsetAngle: 0,
  effectIntensity: 0.1,
  patternRotation: 55,
  zoom: 0.9,
  translateY: "-5%",
};

const DEFAULT_TARGET_PARAMS: HalftoneParamsPreset = {
  halftoneSize: "1%",
  dotSpacing: "0.01%",
  rgbOffset: "0%",
  rgbOffsetAngle: 45,
  effectIntensity: 1,
  patternRotation: 55,
  zoom: 0.5,
  translateY: "0%",
};

const DEFAULT_SCROLL_SETTINGS: ScrollTriggerSettings = {
  start: "15% 28%",
  end: "60% 0%",
  scrub: true,
  markers: true,
};

const DEFAULT_PATTERN_ROTATION = DEFAULT_INITIAL_PARAMS.patternRotation;

export const HALFTONE_SCROLL_DEFAULTS = {
  aspectRatio: DEFAULT_ASPECT_RATIO,
  viewportWidthRatio: 1,
  maxWidth: 1080,
  minWidth: 320,
  imageSrc: "/img/webgl.png",
  scroll: DEFAULT_SCROLL_SETTINGS,
  initialParams: DEFAULT_INITIAL_PARAMS,
  targetParams: DEFAULT_TARGET_PARAMS,
};

const parseDelimitedRatio = (value: string): [number, number] | null => {
  const normalized = value.replace(/\s+/g, "");
  const delimiter = normalized.includes(":")
    ? ":"
    : normalized.includes("/")
    ? "/"
    : null;
  if (!delimiter) return null;
  const [rawWidth, rawHeight] = normalized.split(delimiter);
  const width = Number(rawWidth);
  const height = Number(rawHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return [width, height];
};

const resolveAspectRatio = (value?: AspectRatioInput): ResolvedAspectRatio => {
  if (typeof value === "number") {
    return value > 0 ? createAspectRatioValue(1, value) : DEFAULT_ASPECT_RATIO;
  }
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return createAspectRatioValue(1, numeric);
    }
    const parsedPair = parseDelimitedRatio(value);
    if (parsedPair) {
      return createAspectRatioValue(parsedPair[0], parsedPair[1]);
    }
    return DEFAULT_ASPECT_RATIO;
  }
  if (value && typeof value === "object") {
    return createAspectRatioValue(value.width, value.height);
  }
  return DEFAULT_ASPECT_RATIO;
};

const createResponsiveWidthValue = (
  minWidth: number,
  maxWidth: number,
  viewportWidthRatio: number
) =>
  `clamp(${minWidth}px, ${(viewportWidthRatio * 100).toFixed(
    2
  )}vw, ${maxWidth}px)`;

const resolveParams = (
  base: HalftoneParamsPreset,
  overrides: Partial<HalftoneParamsPreset> | undefined,
  rotation: number
): HalftoneParamsPreset => {
  const merged = { ...base, ...overrides };
  if (overrides?.patternRotation === undefined) {
    merged.patternRotation = rotation;
  }
  return merged;
};

export const resolveHalftoneScrollConfig = (
  config?: HalftoneSectionConfigInput
): HalftoneSectionConfig => {
  const aspectRatio = resolveAspectRatio(
    config?.aspectRatio ?? HALFTONE_SCROLL_DEFAULTS.aspectRatio
  );
  const viewportWidthRatio = clamp(
    config?.viewportWidthRatio ?? HALFTONE_SCROLL_DEFAULTS.viewportWidthRatio,
    0.1,
    1
  );
  const maxWidth = Math.max(
    config?.maxWidth ?? HALFTONE_SCROLL_DEFAULTS.maxWidth,
    1
  );
  const minWidth = Math.min(
    Math.max(config?.minWidth ?? HALFTONE_SCROLL_DEFAULTS.minWidth, 1),
    maxWidth
  );
  const imageSrc = config?.imageSrc ?? HALFTONE_SCROLL_DEFAULTS.imageSrc;
  const fallbackPatternRotation =
    config?.patternRotation ??
    config?.params?.initial?.patternRotation ??
    config?.params?.target?.patternRotation ??
    DEFAULT_PATTERN_ROTATION;
  const scroll: ScrollTriggerSettings = {
    start: config?.scroll?.start ?? HALFTONE_SCROLL_DEFAULTS.scroll.start,
    end: config?.scroll?.end ?? HALFTONE_SCROLL_DEFAULTS.scroll.end,
    scrub: config?.scroll?.scrub ?? HALFTONE_SCROLL_DEFAULTS.scroll.scrub,
    markers: config?.scroll?.markers ?? HALFTONE_SCROLL_DEFAULTS.scroll.markers,
  };
  const initialParams = resolveParams(
    HALFTONE_SCROLL_DEFAULTS.initialParams,
    config?.params?.initial,
    fallbackPatternRotation
  );
  const targetParams = resolveParams(
    HALFTONE_SCROLL_DEFAULTS.targetParams,
    config?.params?.target,
    fallbackPatternRotation
  );
  const responsiveWidthValue = createResponsiveWidthValue(
    minWidth,
    maxWidth,
    viewportWidthRatio
  );
  const fallbackCanvasSize = {
    width: maxWidth,
    height: Math.round(maxWidth * aspectRatio.scalar),
  };

  return {
    aspectRatio,
    responsiveWidthValue,
    fallbackCanvasSize,
    imageSrc,
    scroll,
    initialParams,
    targetParams,
  };
};
