"use client";

import { useMemo, ReactNode, cloneElement, isValidElement } from "react";
import { createDiamondMaskSVG } from "../../lib/maskUtils";

export interface HalftoneEffectProps {
  children: ReactNode;
  dotRadius?: number;
  dotSpacing?: number;
  angle?: number;
  className?: string;
}

export default function HalftoneEffect({
  children,
  dotRadius = 2,
  dotSpacing = 5,
  angle = 45,
  className = "",
}: HalftoneEffectProps) {
  const maskSVG = useMemo(() => {
    return createDiamondMaskSVG(dotRadius, dotSpacing, angle);
  }, [dotRadius, dotSpacing, angle]);

  const patternSize = Math.round(dotSpacing * 1.414213562 * 100) / 100;

  const maskStyles: React.CSSProperties & Record<string, string> = {
    "--dot-radius": `${dotRadius}px`,
    "--dot-spacing": `${dotSpacing}px`,
    "--mask-angle": `${angle}deg`,
    "--pattern-size": `${patternSize}px`,
    WebkitMaskImage: `url("${maskSVG}")`,
    maskImage: `url("${maskSVG}")`,
    WebkitMaskSize: `${patternSize}px ${patternSize}px`,
    maskSize: `${patternSize}px ${patternSize}px`,
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskRepeat: "repeat",
    maskRepeat: "repeat",
  };

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
