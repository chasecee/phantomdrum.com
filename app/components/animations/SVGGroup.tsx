"use client";

import AnimatedSVG from "./AnimatedSVG";
import Phantom from "../svgs/Phantom";
import Drum from "../svgs/Drum";
import Initialize from "../svgs/Initialize";

const aspectRatios = [886 / 164, 886 / 161, 855 / 72] as const;
const multiplier = 3;
const gap = 24;

export default function SVGGroup() {
  return (
    <div className="relative h-[50svw]">
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
        heightPercent={20}
        className="text-[#2F7CAC] mt-4"
      >
        <Initialize className="w-full h-full" />
      </AnimatedSVG>
    </div>
  );
}
