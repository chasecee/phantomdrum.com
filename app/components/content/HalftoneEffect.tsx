"use client";

import { useMemo, ReactNode, cloneElement, isValidElement } from "react";
import { createDiamondMaskSVG } from "../../lib/maskUtils";
import { useBreakpoint, getResponsiveValue } from "../../lib/useBreakpoint";

type ResponsiveValue<T> = T | Partial<Record<"sm" | "md" | "lg" | "xl" | "2xl", T>>;

export interface HalftoneEffectProps {
  children: ReactNode;
  dotRadius?: ResponsiveValue<number>;
  dotSpacing?: ResponsiveValue<number>;
  blur?: ResponsiveValue<number>;
  className?: string;
}

export default function HalftoneEffect({
  children,
  dotRadius = 2,
  dotSpacing = 5,
  blur,
  className = "",
}: HalftoneEffectProps) {
  const breakpoint = useBreakpoint();

  const resolvedDotRadius = useMemo(
    () => getResponsiveValue(dotRadius, breakpoint),
    [dotRadius, breakpoint]
  );

  const resolvedDotSpacing = useMemo(
    () => getResponsiveValue(dotSpacing, breakpoint),
    [dotSpacing, breakpoint]
  );

  const resolvedBlur = useMemo(
    () => (blur !== undefined ? getResponsiveValue(blur, breakpoint) : undefined),
    [blur, breakpoint]
  );

  const maskSVG = useMemo(
    () => createDiamondMaskSVG(resolvedDotRadius, resolvedDotSpacing),
    [resolvedDotRadius, resolvedDotSpacing]
  );

  const patternSize = useMemo(
    () => Math.round(resolvedDotSpacing * 1.414213562 * 100) / 100,
    [resolvedDotSpacing]
  );

  const maskStyles = useMemo<React.CSSProperties & Record<string, string>>(
    () => ({
      "--dot-radius": `${resolvedDotRadius}px`,
      "--dot-spacing": `${resolvedDotSpacing}px`,
      "--pattern-size": `${patternSize}px`,
      WebkitMaskImage: `url("${maskSVG}")`,
      maskImage: `url("${maskSVG}")`,
      WebkitMaskSize: `${patternSize}px ${patternSize}px`,
      maskSize: `${patternSize}px ${patternSize}px`,
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskRepeat: "repeat",
      maskRepeat: "repeat",
      ...(resolvedBlur !== undefined && {
        filter: `blur(${resolvedBlur}px)`,
        WebkitFilter: `blur(${resolvedBlur}px)`,
      }),
    }),
    [resolvedDotRadius, resolvedDotSpacing, patternSize, maskSVG, resolvedBlur]
  );

  if (isValidElement(children)) {
    const childProps = children.props as {
      className?: string;
      style?: React.CSSProperties;
    };
    return cloneElement(children, {
      className: `${className} ${childProps.className || ""}`.trim(),
      style: {
        ...childProps.style,
        ...maskStyles,
      },
    } as Partial<typeof childProps>);
  }

  return (
    <div className={className} style={maskStyles}>
      {children}
    </div>
  );
}
