"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import the Three.js scene to prevent upfront bundling
const AnimatedMultiCubeScene = dynamic(
  () =>
    import(
      /* webpackChunkName: "three-components" */ "./AnimatedMultiCubeScene"
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-white opacity-50">Loading 3D scene...</div>
      </div>
    ),
  }
);

type Rotation = { x: number; y: number; z: number };

interface AnimatedMultiCubeProps {
  texts: string[];
  trigger: React.RefObject<HTMLElement>;
  start: string;
  end: string;
  scrub?: number | boolean;
  from?: {
    rotation?: { x?: number; y?: number; z?: number };
    scale?: number;
    yPercent?: number;
  };
  to: {
    rotation: { x: number; y: number; z: number };
    scale?: number;
    yPercent?: number;
  };
  showMarkers?: boolean;
  invalidateOnRefresh?: boolean;
  size?: number;
  heightRatio?: number;
  widthRatio?: number;
  colors?: string[];
  textColor?: string;
  textSize?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  className?: string;
  maxWidth?: number;
  font?: string | object;
  spacing?: number;
  stagger?: boolean;
  staggerDelay?: number;
  fillMode?: "fill" | "outline";
  strokeWidth?: number;
  matchTextColor?: boolean;
}

export default function AnimatedMultiCube(props: AnimatedMultiCubeProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-white opacity-50">Loading 3D scene...</div>
        </div>
      }
    >
      <AnimatedMultiCubeScene {...props} />
    </Suspense>
  );
}
