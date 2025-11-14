"use client";

import { useRef, useEffect, ReactNode } from "react";
import gsap from "gsap";

export interface AnimatedHalftoneMaskProps {
  children: ReactNode;
  containerRef: React.RefObject<HTMLElement | null>;
  startRadius?: number;
  endRadius?: number;
  startSpacing?: number;
  endSpacing?: number;
  scrollStart?: string;
  scrollEnd?: string;
  scrub?: boolean | number;
  showMarkers?: boolean;
  className?: string;
}

export default function AnimatedHalftoneMask({
  children,
  containerRef,
  startRadius = 2,
  endRadius = 6,
  startSpacing = 6,
  endSpacing = 18,
  scrollStart = "top bottom",
  scrollEnd = "bottom top",
  scrub = true,
  showMarkers = false,
  className = "",
}: AnimatedHalftoneMaskProps) {
  const maskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!maskRef.current || !containerRef.current) return;

    const createMaskSVG = (radius: number, spacing: number): string => {
      const patternSize = spacing * 1.414213562;
      const halfPattern = patternSize / 2;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" x="0" y="0" width="${patternSize}" height="${patternSize}" patternUnits="userSpaceOnUse"><circle cx="${halfPattern}" cy="0" r="${radius}" fill="black"/><circle cx="0" cy="${halfPattern}" r="${radius}" fill="black"/><circle cx="${patternSize}" cy="${halfPattern}" r="${radius}" fill="black"/><circle cx="${halfPattern}" cy="${patternSize}" r="${radius}" fill="black"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    };

    const updateMask = (progress: number) => {
      if (!maskRef.current) return;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      const radius = startRadius + (endRadius - startRadius) * clampedProgress;
      const spacing =
        startSpacing + (endSpacing - startSpacing) * clampedProgress;
      const maskUrl = createMaskSVG(radius, spacing);
      const patternSize = spacing * 1.414213562;
      maskRef.current.style.maskImage = `url("${maskUrl}")`;
      maskRef.current.style.setProperty(
        "-webkit-mask-image",
        `url("${maskUrl}")`
      );
      maskRef.current.style.maskSize = `${patternSize}px ${patternSize}px`;
      maskRef.current.style.setProperty(
        "-webkit-mask-size",
        `${patternSize}px ${patternSize}px`
      );
    };

    updateMask(0);

    const ctx = gsap.context(() => {
      const scrollTrigger = {
        trigger: containerRef.current,
        start: scrollStart,
        end: scrollEnd,
        scrub,
        markers: showMarkers,
        onUpdate: (self: { progress: number }) => {
          updateMask(self.progress);
        },
        onEnter: () => {
          updateMask(0);
        },
        onLeave: () => {
          updateMask(1);
        },
        onLeaveBack: () => {
          updateMask(0);
        },
      };

      gsap.to({}, { scrollTrigger });
    });

    return () => ctx.revert();
  }, [
    containerRef,
    startRadius,
    endRadius,
    startSpacing,
    endSpacing,
    scrollStart,
    scrollEnd,
    scrub,
    showMarkers,
  ]);

  return (
    <div ref={maskRef} className={className}>
      {children}
    </div>
  );
}
