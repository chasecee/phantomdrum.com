"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CanvasHalftoneWebGL,
  type CanvasHalftoneWebGLHandle,
} from "../canvas/CanvasHalftoneWebGL";

const INITIAL_PARAMS = {
  halftoneSize: 50,
  dotSpacing: 80,
  rgbOffset: 50,
  effectIntensity: 1,
};

const TARGET_PARAMS = {
  halftoneSize: 4,
  dotSpacing: 8,
  rgbOffset: 0.5,
  effectIntensity: 1,
};

export function HalftoneScrollSection() {
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<CanvasHalftoneWebGLHandle>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!scrollSectionRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const proxy = { ...INITIAL_PARAMS };
    let rafId: number | null = null;

    const ctx = gsap.context(() => {
      gsap.to(proxy, {
        halftoneSize: TARGET_PARAMS.halftoneSize,
        dotSpacing: TARGET_PARAMS.dotSpacing,
        rgbOffset: TARGET_PARAMS.rgbOffset,
        effectIntensity: TARGET_PARAMS.effectIntensity,
        ease: "linear",
        scrollTrigger: {
          trigger: scrollSectionRef.current,
          start: "50% 90%",
          end: "50% 10%",
          scrub: 1,
          invalidateOnRefresh: true,
          markers: true,
        },
        onUpdate: () => {
          if (!canvasRef.current || rafId !== null) return;
          rafId = requestAnimationFrame(() => {
            rafId = null;
            canvasRef.current?.updateParams({
              halftoneSize: proxy.halftoneSize,
              dotSpacing: proxy.dotSpacing,
              rgbOffset: proxy.rgbOffset,
              effectIntensity: proxy.effectIntensity,
            });
          });
        },
      });
    }, scrollSectionRef);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={scrollSectionRef}
      className="relative w-full flex flex-col gap-8 aspect-1/4"
    >
      <div className="sticky top-0 w-full mx-auto aspect-square">
        <CanvasHalftoneWebGL
          ref={canvasRef}
          width={1024}
          height={1024}
          imageSrc="/img/chase.png"
          params={INITIAL_PARAMS}
          className="w-full h-auto"
        />
      </div>
    </section>
  );
}
