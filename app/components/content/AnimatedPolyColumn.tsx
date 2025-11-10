"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const AnimatedPolyColumnScene = dynamic(
  () =>
    import("./ThreeScenes").then((mod) => ({
      default: mod.AnimatedPolyColumnScene,
    })),
  {
    ssr: false,
    loading: () => null,
  }
);

interface AnimatedPolyColumnProps {
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
  to?: {
    rotation?: { x?: number; y?: number; z?: number };
    scale?: number;
    yPercent?: number;
  };
  showMarkers?: boolean;
  invalidateOnRefresh?: boolean;
  radius?: number;
  height?: number;
  bodyColor?: string;
  edgeColor?: string;
  textSize?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  className?: string;
  strokeWidth?: number;
}

export default function AnimatedPolyColumn(
  props: AnimatedPolyColumnProps
) {
  return (
    <Suspense fallback={null}>
      <AnimatedPolyColumnScene {...props} />
    </Suspense>
  );
}
