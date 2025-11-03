"use client";

import AnimatedSVG from "./AnimatedSVG";
import Phantom from "../svgs/Phantom";
import Drum from "../svgs/Drum";
import Initialize from "../svgs/Initialize";

const aspectRatios = [886 / 164, 886 / 161, 855 / 72] as const;
const multiplier = 2;
const gap = 0;

export default function SVGGroup() {
  return (
    <div className="relative w-full aspect-100/50">
      <AnimatedSVG
        aspectRatio={aspectRatios[0]}
        aspectRatios={aspectRatios}
        multiplier={multiplier}
        index={0}
        gap={gap}
        heightPercent={40}
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
        heightPercent={40}
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
        className="text-[#2F7CAC]"
      >
        <Initialize className="w-full h-full" />
      </AnimatedSVG>
    </div>
  );
}
