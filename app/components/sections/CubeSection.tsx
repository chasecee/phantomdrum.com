"use client";

import { RefObject, useRef, Suspense } from "react";
import dynamic from "next/dynamic";

const AnimatedMultiCube = dynamic(
  () =>
    import(
      /* webpackChunkName: "animated-multicube" */ "../content/AnimatedMultiCube"
    ),
  { ssr: false }
);

export default function CubeSection() {
  const multiCubeContainerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div
      ref={multiCubeContainerRef}
      className="aspect-[1.5/1] my-[10vw] w-full relative mix-blend-screen"
    >
      <Suspense fallback={<div className="absolute inset-0" />}>
        <AnimatedMultiCube
          texts={[
            "GHOST GRADE",
            "FARM-FRESH",
            "ABSTRACT YET FAMILIAR",
            "CLASSIC SUNDAY DINNER",
            "BIG OL BEATS",
          ]}
          trigger={multiCubeContainerRef as RefObject<HTMLElement>}
          start="40% 80%"
          end="60% 20%"
          from={{ rotation: { x: 0.01, y: 0, z: 0 } }}
          to={{
            rotation: { x: -0.01, y: -Math.PI * 0.5, z: 0 },
          }}
          className="absolute inset-0"
          heightRatio={0.175}
          widthRatio={1.1}
          size={3}
          spacing={0.1}
          stagger={true}
          staggerDelay={0.1}
          fillMode="outline"
          strokeWidth={10}
          matchTextColor={true}
        />
      </Suspense>
    </div>
  );
}

