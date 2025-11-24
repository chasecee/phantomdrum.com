"use client";

import type { CSSProperties } from "react";
import { HalftoneLayerCanvas } from "./HalftoneLayerCanvas";
import { useHalftoneScene } from "./useHalftoneScene";
import type { HalftoneSceneConfig } from "./types";

type HalftoneSceneProps = {
  config: HalftoneSceneConfig;
  maskStyle?: CSSProperties;
};

export function HalftoneScene({
  config,
  maskStyle = {
    maskImage:
      "linear-gradient(to bottom, transparent, black 5%, black 90%, transparent)",
    maskSize: "100% 100%",
    maskPosition: "top",
    maskRepeat: "no-repeat",
  },
}: HalftoneSceneProps) {
  const {
    sectionRef,
    contentRef,
    sectionStyle,
    contentStyle,
    canvasDimensions,
    layers,
  } = useHalftoneScene(config);

  return (
    <div
      ref={sectionRef}
      className={`${
        process.env.NODE_ENV === "development" ? "border-2 border-red-500" : ""
      } h-[120cqw] lg:h-[120svh] w-full flex relative z-3 flex-col justify-start-safe items-center`}
    >
      <section
        className="w-full overflow-hidden"
        style={{ ...sectionStyle, ...maskStyle }}
      >
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
              paddingRatio={layer.paddingRatio}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
