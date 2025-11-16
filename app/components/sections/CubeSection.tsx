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
    <HalftoneEffect
      dotRadius={{ sm: 1, md: 2, lg: 3 }}
      dotSpacing={{ sm: 2, md: 5, lg: 6 }}
    >
      <div
        ref={multiCubeContainerRef}
        className="aspect-square max-h-[80svh] my-[10vw] w-full relative overflow-hidden"
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
          scrub={true}
          className="absolute inset-0"
          heightRatio={0.22}
          widthRatio={0.95}
          size={3}
          spacing={0.1}
          stagger={true}
          staggerDelay={0.1}
          fillMode="outline"
          strokeWidth={5}
          showMarkers={false}
          matchTextColor={true}
        />
      </div>
    </HalftoneEffect>
  );
}
