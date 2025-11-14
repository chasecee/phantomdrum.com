"use client";

import { RefObject, useRef } from "react";
import { AnimatedMultiCubeScene } from "../content/three/AnimatedMultiCubeScene";
import HalftoneEffect from "../content/HalftoneEffect";

const CUBE_TEXTS = [
  "GHOST GRADE",
  "FARM-FRESH",
  "ABSTRACT YET FAMILIAR",
  "CLASSIC SUNDAY DINNER",
  "BIG OL BEATS",
];

export default function CubeSection() {
  const multiCubeContainerRef = useRef<HTMLDivElement>(null);

  return (
    <HalftoneEffect>
      <div
        ref={multiCubeContainerRef}
        className="aspect-square my-[20vw] w-full relative border-2 border-amber-500"
      >
        <AnimatedMultiCubeScene
          texts={CUBE_TEXTS}
          trigger={multiCubeContainerRef as RefObject<HTMLElement>}
          start="40% 80%"
          end="60% 30%"
          from={{ rotation: { x: 0.01, y: 0, z: 0 } }}
          to={{
            rotation: { x: -0.01, y: -Math.PI * 0.5, z: 0 },
          }}
          className="absolute inset-0"
          heightRatio={0.22}
          widthRatio={1}
          size={3}
          spacing={0.1}
          stagger={true}
          staggerDelay={0.1}
          fillMode="outline"
          strokeWidth={10}
          showMarkers={true}
          matchTextColor={true}
        />
      </div>
    </HalftoneEffect>
  );
}
