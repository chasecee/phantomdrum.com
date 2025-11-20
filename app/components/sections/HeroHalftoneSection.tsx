"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import ScrollTransform from "@animations/ScrollTransform";
import { HalftoneScene } from "../halftone/HalftoneScene";
import { experienceHalftoneSceneConfig } from "../halftone/sceneConfig";

export default function HeroHalftoneSection() {
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative h-[130vw] z-2 fade-in-slow" ref={anchorRef}>
      <HalftoneScene config={experienceHalftoneSceneConfig} />
      <ScrollTransform
        anchorRef={anchorRef}
        start={{ anchor: 0, viewport: 0 }}
        end={{ anchor: 0.82, viewport: 0.4 }}
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
                "radial-gradient(circle at 50% 50%, black 50%, transparent 60%)",
            } as CSSProperties
          }
        />
        <div
          className="absolute inset-0 "
          style={
            {
              backgroundImage:
                "radial-gradient(circle at 80.8% 26.2%, black 10%,  transparent 15%)",
            } as CSSProperties
          }
        />
      </ScrollTransform>
    </div>
  );
}
