"use client";

import { useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedSVGProps {
  children: ReactNode;
  aspectRatio: number;
  multiplier: number;
}

export default function AnimatedSVG({
  children,
  aspectRatio,
  multiplier,
}: AnimatedSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;

    const ctx = gsap.context(() => {
      const containerWidth = container.offsetWidth;
      const finalHeight = containerWidth / aspectRatio;
      const initialHeight = finalHeight * multiplier;
      const scrollDistance = initialHeight - finalHeight;

      gsap.set(content, { height: initialHeight, force3D: true });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: container,
            start: "top top",
            end: () => `+=${scrollDistance}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        .to(content, {
          height: finalHeight,
          ease: "none",
          force3D: true,
        });
    }, containerRef);

    return () => ctx.revert();
  }, [aspectRatio, multiplier]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div ref={contentRef} className="w-full will-change-[height]">
        {children}
      </div>
    </div>
  );
}
