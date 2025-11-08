"use client";

import { useEffect, useRef, ReactNode, useMemo } from "react";
import { getGSAP, getScrollTrigger } from "../../lib/gsap";

interface AnimatedSVGProps {
  children: ReactNode;
  aspectRatio: number;
  multiplier: number;
  index: number;
  gap: number;
  aspectRatios: readonly number[];
  heightPercent?: number;
  className?: string;
}

export default function AnimatedSVG({
  children,
  aspectRatio,
  multiplier,
  index,
  gap,
  aspectRatios,
  heightPercent,
  className,
}: AnimatedSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const aspectRatiosKey = useMemo(() => aspectRatios.join(","), [aspectRatios]);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;
    const trigger = container.closest(".relative");

    if (!trigger) return;

    let ctx: ReturnType<typeof import("gsap").gsap.context> | null = null;
    let isActive = true;

    const initAnimation = async () => {
      if (!isActive) return;

      const [gsap, ScrollTrigger] = await Promise.all([
        getGSAP(),
        getScrollTrigger(),
      ]);

      if (!isActive || !containerRef.current || !contentRef.current) return;

      ctx = gsap.context(() => {
        gsap.set(content, {
          scaleY: multiplier,
          transformOrigin: "top center",
          force3D: true,
          willChange: "transform",
          z: 0,
        });

        gsap.to(content, {
          scaleY: 1,
          ease: "none",
          force3D: true,
          immediateRender: false,
          scrollTrigger: {
            trigger: trigger,
            start: "top 24",
            end: "bottom 48",
            scrub: true,
            invalidateOnRefresh: false,
            anticipatePin: 1,
            refreshPriority: -index,
            markers: false,
          },
        });
      }, containerRef);
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => initAnimation(), { timeout: 2000 });
    } else {
      setTimeout(() => initAnimation(), 100);
    }

    return () => {
      isActive = false;
      ctx?.revert();
    };
  }, [
    aspectRatio,
    multiplier,
    index,
    gap,
    aspectRatios,
    aspectRatiosKey,
    heightPercent,
  ]);

  return (
    <div
      ref={containerRef}
      className={`w-full ${className || ""}`}
      style={{
        ...(heightPercent ? { height: `${heightPercent}%` } : {}),
        overflow: "visible",
      }}
    >
      <div
        ref={contentRef}
        className="w-full h-full"
        style={{ willChange: "transform" }}
      >
        {children}
      </div>
    </div>
  );
}
