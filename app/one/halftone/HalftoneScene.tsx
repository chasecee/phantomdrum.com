"use client";

import type { CSSProperties } from "react";
import { HalftoneLayerCanvas } from "./HalftoneLayerCanvas";
import { useHalftoneScene } from "./useHalftoneScene";
import type { HalftoneSceneConfig } from "./types";

type HalftoneSceneProps = {
  config: HalftoneSceneConfig;
  maskStyle?: CSSProperties;
};

const DEFAULT_MASK_STYLE: CSSProperties = {
  maskImage:
    "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
  maskSize: "100% 100%",
  maskPosition: "top",
  maskRepeat: "no-repeat",
};

export function HalftoneScene({
  config,
  maskStyle = DEFAULT_MASK_STYLE,
}: HalftoneSceneProps) {
  const {
    sectionRef,
    contentRef,
    sectionStyle,
    contentStyle,
    canvasDimensions,
    layers,
    paddingRatio,
  } = useHalftoneScene(config);

  return (
    <section ref={sectionRef} className="w-full relative" style={sectionStyle}>
      <div style={maskStyle}>
        <div
          ref={contentRef}
          className="mx-auto relative isolate"
          style={contentStyle}
        >
          {layers.map((layer) => (
            <HalftoneLayerCanvas
              key={layer.key}
              containerRef={layer.containerRef}
              canvasRef={layer.canvasRef}
              imageSrc={layer.imageSrc}
              imageFit={layer.imageFit}
              className={layer.className}
              zIndex={layer.zIndex}
              width={canvasDimensions.width}
              height={canvasDimensions.height}
              initialParams={layer.initialRendererParams}
              paddingRatio={paddingRatio}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
