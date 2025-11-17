import type {
  AspectRatioInput,
  HalftoneLayerConfig,
  HalftoneLayerDefinitionInput,
  HalftoneParamsPreset,
  HalftoneSectionConfig,
  HalftoneSectionConfigInput,
  ImageFitMode,
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

const BASE_PARAM_TEMPLATE: HalftoneParamsPreset = {
  halftoneSize: "2%",
  dotSpacing: ".05%",
  rgbOffset: "20%",
  rgbOffsetAngle: 90,
  effectIntensity: 0.1,
  patternRotation: 55,
  zoom: 1.5,
  translateY: "10%",
};

const withParams = (
  overrides: Partial<HalftoneParamsPreset>
): HalftoneParamsPreset => ({
  ...BASE_PARAM_TEMPLATE,
  ...overrides,
});

const DEFAULT_IMAGE_FIT: ImageFitMode = "contain";

const DEFAULT_LAYER_DEFINITIONS: HalftoneLayerDefinitionInput[] = [
  {
    imageSrc: "/img/optimized/linesbg.webp",
    imageFit: "cover",
    placement: "background",
    params: {
      initial: withParams({
        halftoneSize: "22%",
        dotSpacing: "0.5%",
        rgbOffset: "10%",
        rgbOffsetAngle: 45,
        zoom: 1.25,
      }),
      target: withParams({
        halftoneSize: "4%",
        dotSpacing: "0.05%",
        rgbOffset: "0%",
        rgbOffsetAngle: 10,
        zoom: 0.75,
        translateY: "0%",
      }),
    },
  },
  {
    imageSrc: "/img/optimized/planet-cropped.webp",
    imageFit: "contain",
    placement: "foreground",
    params: {
      initial: withParams({}),
      target: withParams({
        halftoneSize: "5%",
        dotSpacing: "0.1%",
        rgbOffset: "1%",
        effectIntensity: 0.4,
        zoom: 0.75,
        translateY: "0%",
      }),
    },
  },
];

const DEFAULT_SCROLL_SETTINGS: ScrollTriggerSettings = {
  start: "20% 28%",
  end: "30% 0%",
  scrub: true,
  markers: true,
};

export const HALFTONE_SCROLL_DEFAULTS = {
  aspectRatio: DEFAULT_ASPECT_RATIO,
  viewportWidthRatio: 1,
  maxWidth: 1080,
  minWidth: 320,
  scroll: DEFAULT_SCROLL_SETTINGS,
  layers: DEFAULT_LAYER_DEFINITIONS,
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

const normalizeLayerDefinition = (
  definition: HalftoneLayerDefinitionInput,
  fallbackFit: ImageFitMode = DEFAULT_IMAGE_FIT
): HalftoneLayerConfig => ({
  imageSrc: definition.imageSrc,
  imageFit: definition.imageFit ?? fallbackFit,
  placement: definition.placement ?? "foreground",
  className: definition.className,
  initialParams: { ...definition.params.initial },
  targetParams: { ...definition.params.target },
});

const resolveBaseLayerIndex = (
  requestedIndex: number | undefined,
  layers: HalftoneLayerConfig[]
): number => {
  if (
    typeof requestedIndex === "number" &&
    requestedIndex >= 0 &&
    requestedIndex < layers.length
  ) {
    return requestedIndex;
  }
  const firstForeground = layers.findIndex(
    (layer) => layer.placement !== "background"
  );
  if (firstForeground !== -1) {
    return firstForeground;
  }
  return 0;
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
  const scroll: ScrollTriggerSettings = {
    start: config?.scroll?.start ?? HALFTONE_SCROLL_DEFAULTS.scroll.start,
    end: config?.scroll?.end ?? HALFTONE_SCROLL_DEFAULTS.scroll.end,
    scrub: config?.scroll?.scrub ?? HALFTONE_SCROLL_DEFAULTS.scroll.scrub,
    markers: config?.scroll?.markers ?? HALFTONE_SCROLL_DEFAULTS.scroll.markers,
  };
  const baseLayers =
    config?.layers?.length && config.layers.length > 0
      ? config.layers
      : HALFTONE_SCROLL_DEFAULTS.layers;
  const layers = baseLayers.map((layer) => normalizeLayerDefinition(layer));
  const resolvedBaseLayerIndex = resolveBaseLayerIndex(
    config?.baseLayerIndex,
    layers
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
    scroll,
    layers,
    baseLayerIndex: resolvedBaseLayerIndex,
  };
};
