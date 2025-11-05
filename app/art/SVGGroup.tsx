"use client";

import AnimatedSVG from "../components/animations/AnimatedSVG";
import Phantom from "../components/svgs/Phantom";
import Drum from "../components/svgs/Drum";
import Initialize from "../components/svgs/Initialize";

const aspectRatios = [886 / 164, 886 / 161, 855 / 72] as const;
const multiplier = 3;
const gap = -10;

export default function SVGGroup() {
  return (
    <div className="relative w-full aspect-100/42 max-h-svh">
      <AnimatedSVG
        aspectRatio={aspectRatios[0]}
        aspectRatios={aspectRatios}
        multiplier={multiplier}
        index={0}
        gap={gap}
        heightPercent={41}
        className="text-neutral-200"
      >
        <Phantom className="w-full h-full" />
      </AnimatedSVG>
      <AnimatedSVG
        aspectRatio={aspectRatios[1]}
        aspectRatios={aspectRatios}
        multiplier={multiplier}
        index={1}
        gap={gap}
        heightPercent={41}
        className="text-neutral-200"
      >
        <Drum className="w-full h-full" />
      </AnimatedSVG>
      <AnimatedSVG
        aspectRatio={aspectRatios[2]}
        aspectRatios={aspectRatios}
        multiplier={multiplier}
        index={2}
        gap={gap}
        heightPercent={18}
        className="text-amber-300"
      >
        <Initialize className="w-full h-full" />
      </AnimatedSVG>
    </div>
  );
}
