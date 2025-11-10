"use client";

import dynamic from "next/dynamic";
import { Suspense, type ComponentType } from "react";

const PREFETCH_DELAY = 2000;

type PrefetchableComponent<P> = ComponentType<P> & {
  preload?: () => Promise<unknown>;
};

const AnimatedPolyColumnScene = dynamic(() =>
  import("./ThreeScenes").then((mod) => ({
    default: mod.AnimatedPolyColumnScene,
  }))
) as PrefetchableComponent<AnimatedPolyColumnProps>;

const scheduleIdle = (callback: () => void) => {
  if (typeof window === "undefined") return;
  const idle = (
    window as Window & {
      requestIdleCallback?: (
        cb: IdleRequestCallback,
        options?: IdleRequestOptions
      ) => number;
    }
  ).requestIdleCallback;
  if (typeof idle === "function") {
    idle(() => callback());
  } else {
    callback();
  }
};

if (typeof window !== "undefined") {
  window.setTimeout(() => {
    scheduleIdle(() => AnimatedPolyColumnScene.preload?.());
  }, PREFETCH_DELAY);
}

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

export default function AnimatedPolyColumn(props: AnimatedPolyColumnProps) {
  return (
    <Suspense fallback={null}>
      <AnimatedPolyColumnScene {...props} />
    </Suspense>
  );
}
