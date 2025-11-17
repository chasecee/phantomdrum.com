"use client";

import { CanvasHalftoneWebGL } from "../../canvas/CanvasHalftoneWebGL";
import type {
  CanvasHalftoneWebGLHandle,
  HalftoneWebGLParams,
} from "../../canvas/CanvasHalftoneWebGL";
import type { RefObject } from "react";

type HalftoneLayerCanvasProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<CanvasHalftoneWebGLHandle | null>;
  imageSrc: string;
  imageFit: "cover" | "contain";
  className?: string;
  zIndex: number;
  width: number;
  height: number;
  initialParams: HalftoneWebGLParams;
  paddingRatio: number;
};

export function HalftoneLayerCanvas({
  containerRef,
  canvasRef,
  imageSrc,
  imageFit,
  className,
  zIndex,
  width,
  height,
  initialParams,
  paddingRatio,
}: HalftoneLayerCanvasProps) {
  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full ${className ?? ""}`}
      style={{ zIndex }}
    >
      <CanvasHalftoneWebGL
        ref={canvasRef}
        width={width}
        height={height}
        imageSrc={imageSrc}
        imageFit={imageFit}
        params={initialParams}
        suspendWhenHidden={true}
        paddingRatio={paddingRatio}
        className="w-full h-full"
      />
    </div>
  );
}
