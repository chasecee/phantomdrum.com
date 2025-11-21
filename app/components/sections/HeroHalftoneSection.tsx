"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import ScrollTransform from "@animations/ScrollTransform";
import { HalftoneScene } from "../halftone/HalftoneScene";
import { experienceHalftoneSceneConfig } from "../halftone/sceneConfig";
import HalftoneEffect from "../content/HalftoneEffect";

export default function HeroHalftoneSection() {
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative h-[130vw] max-w-[1080px] mx-auto z-2 fade-in-slow"
      ref={anchorRef}
    >
      <HalftoneEffect
        dotRadius={1.5}
        dotSpacing={5}
        className="HERO_BACKGROUND pointer-events-none"
        applyToChild
      >
        <div
          className={`absolute overflow-hidden left-[15vw] right-[5] top-[-65%] h-full opacity-20 ${
            process.env.NODE_ENV === "development"
              ? "border-0 border-pink-500"
              : ""
          }`}
        >
          <div
            className="absolute inset-0  blur-lg "
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent, black 60%, black 90%,transparent)",
              maskSize: "100% 100%",
              maskPosition: "top",
              maskRepeat: "no-repeat",
            }}
          >
            <div
              className="absolute z-3 top-0 left-[50%] -translate-x-[45%] h-full w-[80%]"
              style={{
                backgroundImage: "url('/img/optimized/linesbg.webp')",
                backgroundSize: "100% 10%",
                backgroundPosition: "50% 50%",
                backgroundRepeat: "repeat-y",
                backgroundColor: "green",
                backgroundBlendMode: "screen",
                maskImage: "url('/img/optimized/linesbg.webp')",
                maskSize: "100% 20%",
                maskPosition: "50% 50%",
                maskRepeat: "repeat-y",
              }}
            />
            <div
              className="absolute z-4 top-0 left-[50%] mix-blend-overlay -translate-x-[50%] h-full w-[80%]"
              style={{
                backgroundImage: "url('/img/optimized/linesbg.webp')",
                backgroundSize: "100% 10%",
                backgroundPosition: "50% 50%",
                backgroundRepeat: "repeat-y",
                backgroundColor: "blue",
                backgroundBlendMode: "screen",
                maskImage: "url('/img/optimized/linesbg.webp')",
                maskSize: "100% 20%",
                maskPosition: "50% 50%",
                maskRepeat: "repeat-y",
              }}
            />
            <div
              className="absolute z-5 top-0 left-[50%] mix-blend-overlay -translate-x-[55%]  h-full   w-[80%]"
              style={{
                backgroundImage: "url('/img/optimized/linesbg.webp')",
                backgroundSize: "100% 10px",
                backgroundPosition: "50% 50%",
                backgroundRepeat: "repeat-y",
                backgroundColor: "red",
                backgroundBlendMode: "screen",
                maskImage: "url('/img/optimized/linesbg.webp')",
                maskSize: "100% 100%",
                maskPosition: "50% 50%",
                maskRepeat: "repeat-y",
              }}
            />
          </div>
        </div>
      </HalftoneEffect>
      <HalftoneScene config={experienceHalftoneSceneConfig} />
      {/* <ScrollTransform
        anchorRef={anchorRef}
        start={{ anchor: 0, viewport: 0 }}
        end={{ anchor: 0.8, viewport: 0.5 }}
        from={{ scale: 1 }}
        to={{ scale: 2 }}
        transformOrigin="50% 50%"
        willChange="transform"
        markers={process.env.NODE_ENV === "development"}
        className="w-full h-full absolute inset-0"
      >
        <div
          className="absolute inset-0 "
          style={
            {
              backgroundImage:
                "radial-gradient(circle, black 44%, transparent 46%)",
            } as CSSProperties
          }
        />
        <div
          className="absolute inset-0 "
          style={
            {
              backgroundImage:
                "radial-gradient(circle at 75.8% 30.2%, black 9%,  transparent 10%)",
            } as CSSProperties
          }
        />
      </ScrollTransform> */}
    </div>
  );
}
