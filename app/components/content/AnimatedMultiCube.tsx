"use client";

import {
  AnimatedMultiCubeScene,
  type AnimatedMultiCubeProps,
} from "./ThreeScenes";

export type { AnimatedMultiCubeProps };

export default function AnimatedMultiCube(props: AnimatedMultiCubeProps) {
  return <AnimatedMultiCubeScene {...props} />;
}
