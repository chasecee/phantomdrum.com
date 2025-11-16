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
  patternRotation?: number;
  keepImageInView?: boolean;
  imageSrc?: string;
  scroll?: Partial<ScrollTriggerSettings>;
  params?: {
    initial?: Partial<HalftoneParamsPreset>;
    target?: Partial<HalftoneParamsPreset>;
  };
};

export type HalftoneSectionConfig = {
  aspectRatio: ResolvedAspectRatio;
  responsiveWidthValue: string;
  fallbackCanvasSize: {
    width: number;
    height: number;
  };
  keepImageInView: boolean;
  imageSrc: string;
  scroll: ScrollTriggerSettings;
  initialParams: HalftoneParamsPreset;
  targetParams: HalftoneParamsPreset;
};

export type HalftoneScrollSectionProps = {
  config?: HalftoneSectionConfigInput;
};
