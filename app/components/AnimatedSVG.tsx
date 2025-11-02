"use client";

import { useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedSVGProps {
  children: ReactNode;
  order: number;
  aspectRatio: number;
}

export default function AnimatedSVG({
  children,
  order,
  aspectRatio,
}: AnimatedSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;
    const containerWidth = container.offsetWidth;
    const finalHeight = containerWidth / aspectRatio;
    const startHeight = finalHeight * 3;

    gsap.set(content, { scaleY: 3, transformOrigin: "top" });
    gsap.set(container, { height: startHeight });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: () => `+=${startHeight}`,
        scrub: 0.5,
      },
    });

    tl.to(content, { scaleY: 1, ease: "power2.out" }, 0);
    tl.to(container, { height: finalHeight, ease: "power2.out" }, 0);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [order, aspectRatio]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div ref={contentRef} className="w-full">
        {children}
      </div>
    </div>
  );
}
