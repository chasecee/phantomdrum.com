"use client";

import { useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedSVGProps {
  children: ReactNode;
  order: number;
  aspectRatio: number;
  multiplier: number;
}

export default function AnimatedSVG({
  children,
  order,
  aspectRatio,
  multiplier,
}: AnimatedSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;
    const containerWidth = container.offsetWidth;
    const finalHeight = containerWidth / aspectRatio;
    const initialHeight = finalHeight * multiplier;
    const scrollDistance = initialHeight - finalHeight;

    gsap.set(content, { height: initialHeight });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: () => `+=${scrollDistance}`,
        scrub: 1,
      },
    });

    tl.to(content, { height: finalHeight, ease: "power2.out" });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [order, aspectRatio, multiplier]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div ref={contentRef} className="w-full">
        {children}
      </div>
    </div>
  );
}
