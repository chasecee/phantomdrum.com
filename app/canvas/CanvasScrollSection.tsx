"use client";

import { RefObject, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  CanvasEffects,
  type CanvasEffectsProps,
  type CanvasEffectsHandle,
  type CanvasDynamicParams,
} from "@/app/canvas/CanvasEffect";
import HalftoneEffect from "../components/content/HalftoneEffect";
import { AnimatedPolyColumnScene } from "../components/content/three/AnimatedPolyColumnScene";
const POLY_COLUMN_TEXTS = [
  "DRUMS",
  "SYNTHS",
  "SAMPLES",
  "FX",
  "LOOPS",
  "TEXTURES",
  "ATMOS",
  "SAMPLERS",
  "LOVE LOOPS!",
  "LOVE TEXTURES!",
  "LOVE ATMOS!",
  "LOVE LOOPS!",
  "LOVE TEXTURES!",
  "LOVE ATMOS!",
];
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type AnimatedParams = Pick<
  CanvasDynamicParams,
  "halftoneSize" | "dotSpacing" | "rgbOffsetX" | "rgbOffsetY"
>;

const PARAM_KEYFRAMES: Record<
  keyof AnimatedParams,
  { start: number; end: number }
> = {
  halftoneSize: { start: 30, end: 4 },
  dotSpacing: { start: 30, end: 3 },
  rgbOffsetX: { start: 0, end: 1 },
  rgbOffsetY: { start: 20, end: -1 },
};

const INITIAL_PARAMS: AnimatedParams = {
  halftoneSize: PARAM_KEYFRAMES.halftoneSize.start,
  dotSpacing: PARAM_KEYFRAMES.dotSpacing.start,
  rgbOffsetX: PARAM_KEYFRAMES.rgbOffsetX.start,
  rgbOffsetY: PARAM_KEYFRAMES.rgbOffsetY.start,
};

const CANVAS_STATIC_PROPS: CanvasEffectsProps = {
  imageSrc: "/img/chase.png",
  width: 430,
  height: 430,
  brightness: 100,
  contrast: 100,
  ...INITIAL_PARAMS,
};

const SCROLL_START = "20% 70%";
const SCROLL_END = "30% 30%";

export function CanvasScrollSection() {
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<CanvasEffectsHandle>(null);
  const polyColumnSectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!scrollSectionRef.current) return;

    const scrubProxy: AnimatedParams = { ...INITIAL_PARAMS };

    const ctx = gsap.context(() => {
      gsap.to(scrubProxy, {
        halftoneSize: PARAM_KEYFRAMES.halftoneSize.end,
        dotSpacing: PARAM_KEYFRAMES.dotSpacing.end,
        rgbOffsetX: PARAM_KEYFRAMES.rgbOffsetX.end,
        rgbOffsetY: PARAM_KEYFRAMES.rgbOffsetY.end,
        ease: "linear",
        scrollTrigger: {
          trigger: scrollSectionRef.current,
          start: SCROLL_START,
          end: SCROLL_END,
          scrub: true,
          invalidateOnRefresh: true,
          markers: false,
        },
        onUpdate: () => {
          if (!canvasRef.current) return;
          canvasRef.current.updateParams({
            halftoneSize: scrubProxy.halftoneSize,
            dotSpacing: scrubProxy.dotSpacing,
            rgbOffsetX: scrubProxy.rgbOffsetX,
            rgbOffsetY: scrubProxy.rgbOffsetY,
          });
        },
      });
    }, scrollSectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={scrollSectionRef}
      className="relative w-full px-8 aspect-1/3 mix-blend-difference"
    >
      <div className="sticky top-8 w-full mx-auto">
        <CanvasEffects ref={canvasRef} {...CANVAS_STATIC_PROPS} />
      </div>
      <div className="w-full sticky top-8">
        <HalftoneEffect blur={0} dotRadius={2} dotSpacing={5}>
          <section
            ref={polyColumnSectionRef}
            className=" w-full aspect-square "
          >
            <AnimatedPolyColumnScene
              texts={POLY_COLUMN_TEXTS}
              trigger={polyColumnSectionRef as RefObject<HTMLElement>}
              start="top 70%"
              end="bottom 30%"
              scrub={1}
              from={{ rotation: { x: 0, y: 0, z: 0 }, scale: 1, yPercent: 40 }}
              to={{
                rotation: { x: 0, y: Math.PI * 4, z: -0.02 },
                scale: 0.45,
                yPercent: -32,
              }}
              radius={5}
              height={3}
              textSize={0.25}
              strokeWidth={5}
              edgeColor="#fbbf24"
              cameraPosition={[0, 0, 25]}
              cameraFov={25}
              className="w-full h-full aspect-square"
              showMarkers={false}
            />
          </section>
        </HalftoneEffect>
      </div>
    </section>
  );
}
