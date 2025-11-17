export type ResponsiveNumeric = number | `${number}%`;

export type LayerParamSet = {
  halftoneSize: ResponsiveNumeric;
  dotSpacing: ResponsiveNumeric;
  rgbOffset: ResponsiveNumeric;
  rgbOffsetAngle: number;
  effectIntensity: number;
  patternRotation: number;
  zoom: number;
  brightness?: number;
  contrast?: number;
  translateY?: ResponsiveNumeric;
};

export type HalftoneLayerDefinition = {
  id?: string;
  imageSrc: string;
  imageFit?: "cover" | "contain";
  placement?: "background" | "foreground";
  className?: string;
  padding?: number;
  params: {
    initial: LayerParamSet;
    target: LayerParamSet;
  };
};

export type HalftoneSceneConfig = {
  aspectRatio: number;
  width: {
    min: number;
    max: number;
    viewportRatio: number;
  };
  scroll: {
    start: string;
    end: string;
    scrub: number | boolean;
    markers?: boolean;
  };
  layers: HalftoneLayerDefinition[];
  baseLayerIndex?: number;
  padding?: number;
};
