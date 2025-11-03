"use client";

import { useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedSVGProps {
  children: ReactNode;
  aspectRatio: number;
  multiplier: number;
  index: number;
  gap: number;
  aspectRatios: number[];
  className?: string;
}

export default function AnimatedSVG({
  children,
  aspectRatio,
  multiplier,
  index,
  gap,
  aspectRatios,
  className,
}: AnimatedSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        content,
        {
          scaleY: multiplier,
          y: () => {
            const parentWidth =
              container.parentElement?.offsetWidth || container.offsetWidth;
            const heights = aspectRatios.map(
              (ar) => (parentWidth / ar) * multiplier
            );
            let offset = 0;
            for (let i = 0; i < index; i++) {
              offset += heights[i] + gap / 2;
            }
            return offset / 1.9;
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
            start: "top top",
            end: "bottom top",
            scrub: 0.1,
            invalidateOnRefresh: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [aspectRatio, multiplier, index, gap, aspectRatios]);

  return (
    <div
      ref={containerRef}
      className={`w-full ${className || ""}`}
      style={{ aspectRatio: `${aspectRatio.toFixed(2)} / 1` }}
    >
      <div ref={contentRef} className="w-full h-full will-change-transform">
        {children}
      </div>
    </div>
  );
}
