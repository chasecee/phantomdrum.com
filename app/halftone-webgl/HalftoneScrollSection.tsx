"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CanvasHalftoneWebGL,
  type CanvasHalftoneWebGLHandle,
} from "../canvas/CanvasHalftoneWebGL";

const INITIAL_PARAMS = {
  halftoneSize: 20,
  dotSpacing: 40,
  rgbOffset: 150,
  effectIntensity: 1,
  patternRotation: 45,
};

const TARGET_PARAMS = {
  halftoneSize: 10,
  dotSpacing: 2,
  rgbOffset: 0,
  effectIntensity: 0.5,
  patternRotation: 45,
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
        patternRotation: TARGET_PARAMS.patternRotation,
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
            canvasRef.current?.updateParams(proxy);
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
      style={{
        backgroundImage: "url(/img/optimized/noise.webp)",
        backgroundSize: "min(100%, 1128px)",
        backgroundPosition: "center",
        containerType: "inline-size",
      }}
      className="relative w-full aspect-1/4 mix-blend-difference"
    >
      <div className="sticky top-0 w-full mx-auto aspect-square">
        <CanvasHalftoneWebGL
          ref={canvasRef}
          width={768}
          height={768}
          imageSrc="/img/chase.png"
          params={INITIAL_PARAMS}
          suspendWhenHidden={false}
          className="w-full h-auto"
        />
      </div>
    </section>
  );
}
