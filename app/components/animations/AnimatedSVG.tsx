"use client";

import { useEffect, useRef, ReactNode, useMemo } from "react";
import { gsap } from "../../lib/gsap";

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

    const ctx = gsap.context(() => {
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

    return () => ctx.revert();
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
