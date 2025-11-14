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

const HALFTONE_MASK_IMAGE = [
  "radial-gradient(circle, #000 0, #000 var(--dot-radius), transparent var(--dot-radius), transparent 100%)",
  "radial-gradient(circle, #000 0, #000 var(--dot-radius), transparent var(--dot-radius), transparent 100%)",
].join(", ");

const HALFTONE_MASK_POSITIONS =
  "calc(50% - var(--pattern-size) / 2) calc(50% - var(--pattern-size) / 2), 50% 50%";
const HALFTONE_MASK_SIZES =
  "var(--pattern-size) var(--pattern-size), var(--pattern-size) var(--pattern-size)";
const MASK_REPEAT = "repeat, repeat";
const SQRT_TWO = Math.SQRT2;
const RADIUS_EPSILON = 0.5;
const SIZE_EPSILON = 0.5;

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
  const lastMaskValuesRef = useRef<{ radius: number; patternSize: number }>();

  useEffect(() => {
    if (!maskRef.current || !containerRef.current) return;
    const element = maskRef.current;
    const applyBaseMaskStyles = () => {
      element.style.setProperty("--dot-radius", `${startRadius}px`);
      element.style.setProperty(
        "--pattern-size",
        `${startSpacing * SQRT_TWO}px`
      );
      element.style.maskImage = HALFTONE_MASK_IMAGE;
      element.style.webkitMaskImage = HALFTONE_MASK_IMAGE;
      element.style.maskSize = HALFTONE_MASK_SIZES;
      element.style.webkitMaskSize = HALFTONE_MASK_SIZES;
      element.style.maskPosition = HALFTONE_MASK_POSITIONS;
      element.style.webkitMaskPosition = HALFTONE_MASK_POSITIONS;
      element.style.maskRepeat = MASK_REPEAT;
      element.style.webkitMaskRepeat = MASK_REPEAT;
    };

    const updateMask = (progress: number) => {
      if (!maskRef.current) return;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      const radius = startRadius + (endRadius - startRadius) * clampedProgress;
      const spacing =
        startSpacing + (endSpacing - startSpacing) * clampedProgress;
      const patternSize = spacing * SQRT_TWO;
      const last = lastMaskValuesRef.current;
      if (last) {
        if (
          Math.abs(radius - last.radius) < RADIUS_EPSILON &&
          Math.abs(patternSize - last.patternSize) < SIZE_EPSILON
        ) {
          return;
        }
      }
      lastMaskValuesRef.current = { radius, patternSize };
      maskRef.current.style.setProperty("--dot-radius", `${radius}px`);
      maskRef.current.style.setProperty("--pattern-size", `${patternSize}px`);
    };

    const forceMaskUpdate = () => {
      lastMaskValuesRef.current = undefined;
      updateMask(0);
    };

    applyBaseMaskStyles();
    forceMaskUpdate();
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
          forceMaskUpdate();
        },
        onLeave: () => {
          lastMaskValuesRef.current = undefined;
          updateMask(1);
        },
        onLeaveBack: () => {
          forceMaskUpdate();
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
