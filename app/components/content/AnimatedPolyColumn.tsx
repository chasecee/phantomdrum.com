"use client";

import dynamic from "next/dynamic";
import { Suspense, type ComponentType } from "react";

type PrefetchableComponent<P> = ComponentType<P> & {
  preload?: () => Promise<unknown>;
};

const AnimatedPolyColumnScene = dynamic(() =>
  import("./ThreeScenes").then((mod) => ({
    default: mod.AnimatedPolyColumnScene,
  }))
) as PrefetchableComponent<AnimatedPolyColumnProps>;

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
  labelRotation?: number;
  fitVertical?: boolean;
  verticalPadding?: number;
}

export default function AnimatedPolyColumn(props: AnimatedPolyColumnProps) {
  const {
    labelRotation = Math.PI / 2,
    fitVertical = true,
    verticalPadding = 0.06,
    ...rest
  } = props;
  return (
    <Suspense fallback={null}>
      <AnimatedPolyColumnScene
        {...rest}
        labelRotation={labelRotation}
        fitVertical={fitVertical}
        verticalPadding={verticalPadding}
      />
    </Suspense>
  );
}
