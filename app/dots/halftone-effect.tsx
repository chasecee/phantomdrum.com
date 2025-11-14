"use client";

import { useMemo, ReactNode, cloneElement, isValidElement } from "react";

function createDiamondMaskSVG(dotRadius: number = 2, dotSpacing: number = 6): string {
  const patternSize = dotSpacing * 1.414213562;
  const halfPattern = patternSize / 2;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" x="0" y="0" width="${patternSize}" height="${patternSize}" patternUnits="userSpaceOnUse"><circle cx="${halfPattern}" cy="0" r="${dotRadius}" fill="black"/><circle cx="0" cy="${halfPattern}" r="${dotRadius}" fill="black"/><circle cx="${patternSize}" cy="${halfPattern}" r="${dotRadius}" fill="black"/><circle cx="${halfPattern}" cy="${patternSize}" r="${dotRadius}" fill="black"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/></svg>`;
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export interface HalftoneEffectProps {
  children: ReactNode;
  dotRadius?: number;
  dotSpacing?: number;
  blur?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function HalftoneEffect({
  children,
  dotRadius = 2,
  dotSpacing = 6,
  blur,
  className = "",
  style,
}: HalftoneEffectProps) {
  const maskSVG = useMemo(
    () => createDiamondMaskSVG(dotRadius, dotSpacing),
    [dotRadius, dotSpacing]
  );

  const patternSize = useMemo(
    () => dotSpacing * 1.414213562,
    [dotSpacing]
  );

  const maskStyles = useMemo<React.CSSProperties & Record<string, string>>(
    () => ({
      "--dot-radius": `${dotRadius}px`,
      "--dot-spacing": `${dotSpacing}px`,
      "--pattern-size": `${patternSize}px`,
      WebkitMaskImage: `url("${maskSVG}")`,
      maskImage: `url("${maskSVG}")`,
      WebkitMaskSize: `${patternSize}px ${patternSize}px`,
      maskSize: `${patternSize}px ${patternSize}px`,
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskRepeat: "repeat",
      maskRepeat: "repeat",
      ...(blur !== undefined && {
        filter: `blur(${blur}px)`,
        WebkitFilter: `blur(${blur}px)`,
      }),
    }),
    [dotRadius, dotSpacing, patternSize, maskSVG, blur]
  );

  return (
    <div className={className} style={style}>
      <div style={maskStyles}>
        {children}
      </div>
    </div>
  );
}
