"use client";

import type { CSSProperties } from "react";
import { CanvasHalftoneWebGL } from "../../canvas/CanvasHalftoneWebGL";
import type { HalftoneScrollSectionProps } from "../halftoneTypes";
import { useHalftoneScrollController } from "./useHalftoneScrollController";

const MASK_STYLE: CSSProperties = {
  maskImage:
    "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
  maskSize: "100% 100%",
  maskPosition: "top",
  maskRepeat: "no-repeat",
};

export function HalftoneScrollSection({
  config,
}: HalftoneScrollSectionProps = {}) {
  const {
    scrollSectionRef,
    responsiveContainerRef,
    canvasRef,
    sectionStyle,
    contentStyle,
    canvasDimensions,
    rendererInitialParams,
    imageSrc,
  } = useHalftoneScrollController(config);

  return (
    <section
      ref={scrollSectionRef}
      className="w-full relative"
      style={sectionStyle}
    >
      <div
        className="sticky top-0 flex w-full justify-center"
        style={MASK_STYLE}
      >
        <div
          ref={responsiveContainerRef}
          className="mx-auto"
          style={contentStyle}
        >
          <CanvasHalftoneWebGL
            ref={canvasRef}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            imageSrc={imageSrc}
            params={rendererInitialParams}
            suspendWhenHidden={false}
            imageFit="cover"
            className="w-full h-full"
          />
        </div>
      </div>
    </section>
  );
}
