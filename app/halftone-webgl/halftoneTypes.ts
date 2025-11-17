export type AspectRatio = {
  width: number;
  height: number;
};

export type ResolvedAspectRatio = AspectRatio & {
  scalar: number;
  css: string;
};

export type AspectRatioInput =
  | AspectRatio
  | number
  | `${number}:${number}`
  | `${number}/${number}`;

export type ResponsiveNumeric = number | `${number}%`;
export type ImageFitMode = "cover" | "contain";

export type HalftoneParamsPreset = {
  halftoneSize: ResponsiveNumeric;
  dotSpacing: ResponsiveNumeric;
  rgbOffset: ResponsiveNumeric;
  rgbOffsetAngle: number;
  effectIntensity: number;
  patternRotation: number;
  zoom: number;
  translateY: ResponsiveNumeric;
};

export type HalftoneLayerDefinitionInput = {
  imageSrc: string;
  imageFit?: ImageFitMode;
  placement?: "background" | "foreground";
  className?: string;
  params: {
    initial: HalftoneParamsPreset;
    target: HalftoneParamsPreset;
  };
};

export type ScrollTriggerSettings = {
  start: string;
  end: string;
  scrub: number | boolean;
  markers: boolean;
};

export type HalftoneSectionConfigInput = {
  aspectRatio?: AspectRatioInput;
  viewportWidthRatio?: number;
  maxWidth?: number;
  minWidth?: number;
  baseLayerIndex?: number;
  scroll?: Partial<ScrollTriggerSettings>;
  layers?: HalftoneLayerDefinitionInput[];
};

export type HalftoneLayerConfig = {
  imageSrc: string;
  imageFit: ImageFitMode;
  placement: "background" | "foreground";
  className?: string;
  initialParams: HalftoneParamsPreset;
  targetParams: HalftoneParamsPreset;
};

export type HalftoneSectionConfig = {
  aspectRatio: ResolvedAspectRatio;
  responsiveWidthValue: string;
  fallbackCanvasSize: {
    width: number;
    height: number;
  };
  scroll: ScrollTriggerSettings;
  layers: HalftoneLayerConfig[];
  baseLayerIndex: number;
};

export type HalftoneScrollSectionProps = {
  config?: HalftoneSectionConfigInput;
};
