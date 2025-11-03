"use client";

import { useEffect, useRef, ReactNode, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
    const ratios = aspectRatios;

    const ctx = gsap.context(() => {
      const updateHeight = () => {
        if (!heightPercent) {
          gsap.set(container, { height: container.offsetWidth / aspectRatio });
        }
      };

      updateHeight();

      gsap.fromTo(
        content,
        {
          scaleY: multiplier,
          y: () => {
            const parentWidth =
              container.parentElement?.offsetWidth || container.offsetWidth;
            const heights = ratios.map((ar) => (parentWidth / ar) * multiplier);
            let offset = 0;
            for (let i = 0; i < index; i++) {
              offset += heights[i] + gap / 2;
            }
            return offset / 1.6;
          },
          transformOrigin: "top center",
        },
        {
          scaleY: 1,
          y: 0,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: container.parentElement,
            start: "top 1rem",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: updateHeight,
            markers: true,
          },
        }
      );
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
      style={heightPercent ? { height: `${heightPercent}%` } : undefined}
    >
      <div ref={contentRef} className="w-full h-full will-change-transform">
        {children}
      </div>
    </div>
  );
}
