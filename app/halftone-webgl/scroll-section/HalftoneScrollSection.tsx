"use client";

import type { CSSProperties } from "react";
import { CanvasHalftoneWebGL } from "../../canvas/CanvasHalftoneWebGL";
import type { HalftoneScrollSectionProps } from "../halftoneTypes";
import { useHalftoneScrollController } from "./useHalftoneScrollController";

const MASK_STYLE: CSSProperties = {
  maskImage:
    "linear-gradient(to bottom, transparent, black 20%, black 95%, transparent)",
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
    sectionStyle,
    contentStyle,
    canvasDimensions,
    layers,
  } = useHalftoneScrollController(config);

  return (
    <section
      ref={scrollSectionRef}
      className="w-full relative"
      style={sectionStyle}
    >
      <div className="" style={MASK_STYLE}>
        <div
          ref={responsiveContainerRef}
          className="mx-auto relative isolate"
          style={contentStyle}
        >
          {layers.map((layer, index) => (
            <div
              key={`${layer.imageSrc}-${index}`}
              ref={layer.containerRef}
              className={`absolute inset-0 w-full h-full ${
                layer.className ?? ""
              }`}
              style={{ zIndex: index + 1 }}
            >
              <CanvasHalftoneWebGL
                ref={layer.canvasRef}
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                imageSrc={layer.imageSrc}
                params={layer.rendererInitialParams}
                suspendWhenHidden={false}
                imageFit={layer.imageFit}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
