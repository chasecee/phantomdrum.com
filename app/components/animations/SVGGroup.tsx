"use client";

import AnimatedSVG from "./AnimatedSVG";
import Phantom from "../svgs/Phantom";
import Drum from "../svgs/Drum";
import Initialize from "../svgs/Initialize";

const aspectRatios = [886 / 164, 886 / 161, 855 / 72];
const multiplier = 2.5;
const gap = 24;

export default function SVGGroup() {
  return (
    <div className="relative p-6">
      <AnimatedSVG
        aspectRatio={aspectRatios[0]}
        aspectRatios={aspectRatios}
        multiplier={multiplier}
        index={0}
        gap={gap}
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
        className="text-[#2F7CAC]"
      >
        <Initialize className="w-full h-full" />
      </AnimatedSVG>
    </div>
  );
}
