"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CanvasHalftoneWebGL,
  type CanvasHalftoneWebGLHandle,
} from "../canvas/CanvasHalftoneWebGL";

const INITIAL_PARAMS = {
  halftoneSize: 15,
  dotSpacing: 20,
  rgbOffset: 11,
  effectIntensity: 0.5,
};

const TARGET_PARAMS = {
  halftoneSize: 4,
  dotSpacing: 6,
  rgbOffset: 1,
  effectIntensity: 0.5,
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
          start: "top 70%",
          end: "bottom 30%",
          scrub: true,
          invalidateOnRefresh: true,
          markers: false,
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
      className="relative w-full flex flex-col gap-8 py-24 aspect-1/4"
    >
      <div className="sticky top-12 w-full mx-auto">
        <CanvasHalftoneWebGL
          ref={canvasRef}
          width={1024}
          height={512}
          imageSrc="/img/chase.png"
          params={INITIAL_PARAMS}
          className="w-full h-auto"
        />
      </div>
      <div className="flex flex-col gap-6 text-sm text-neutral-400 max-w-xl">
        <p>
          Scroll to scrub the halftone parameters. The WebGL worker only updates
          uniforms once per animation frame, so even aggressive wheel events
          won’t spam renders.
        </p>
        <p>
          Try flicking the page quickly—frames stay pinned at display refresh
          while the worker coasts off the main thread.
        </p>
      </div>
    </section>
  );
}
