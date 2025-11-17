import type { HalftoneWebGLParams } from "../../canvas/CanvasHalftoneWebGL";
import type { HalftoneParamsPreset, ResponsiveNumeric } from "../halftoneTypes";

export type ResolvedHalftoneParams = Omit<
  HalftoneParamsPreset,
  "halftoneSize" | "dotSpacing" | "rgbOffset" | "translateY"
> & {
  halftoneSize: number;
  dotSpacing: number;
  rgbOffset: number;
  translateY: ResponsiveNumeric;
};

const isPercentValue = (value: string) => value.trim().endsWith("%");

const resolveResponsiveParamValue = (
  value: HalftoneParamsPreset["halftoneSize"],
  basis: number
) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const numericPortion = isPercentValue(trimmed)
      ? trimmed.slice(0, -1)
      : trimmed;
    const numeric = Number(numericPortion);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    if (isPercentValue(trimmed)) {
      return (numeric / 100) * basis;
    }
    return numeric;
  }
  return value;
};

export const resolveHalftoneParamsForCanvas = (
  params: HalftoneParamsPreset,
  widthBasis: number,
  heightBasis: number
): ResolvedHalftoneParams => {
  const resolvedWidth = Math.max(1, widthBasis);
  const resolvedHeight = Math.max(1, heightBasis);
  const translateY: ResponsiveNumeric =
    typeof params.translateY === "string" && isPercentValue(params.translateY)
      ? (params.translateY.trim() as ResponsiveNumeric)
      : (resolveResponsiveParamValue(
          params.translateY,
          resolvedHeight
        ) as number);
  return {
    ...params,
    halftoneSize: resolveResponsiveParamValue(
      params.halftoneSize,
      resolvedWidth
    ),
    dotSpacing: resolveResponsiveParamValue(params.dotSpacing, resolvedWidth),
    rgbOffset: resolveResponsiveParamValue(params.rgbOffset, resolvedWidth),
    translateY,
  };
};

export const toRendererParams = (
  params: ResolvedHalftoneParams
): Partial<HalftoneWebGLParams> => {
  const { translateY: _translateY, ...rest } = params;
  void _translateY;
  return rest;
};
