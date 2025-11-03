"use client";

import AnimatedSVG from "./AnimatedSVG";
import Phantom from "../svgs/Phantom";
import Drum from "../svgs/Drum";
import Initialize from "../svgs/Initialize";

const aspectRatios = [462 / 100, 462 / 100, 462 / 50];
const multiplier = 1.5;

export default function SVGGroup() {
  return (
    <div className="flex flex-col">
      <AnimatedSVG aspectRatio={aspectRatios[0]} multiplier={multiplier}>
        <Phantom className="w-full h-full" />
      </AnimatedSVG>
      <AnimatedSVG aspectRatio={aspectRatios[1]} multiplier={multiplier}>
        <Drum className="w-full h-full" />
      </AnimatedSVG>
      <AnimatedSVG aspectRatio={aspectRatios[2]} multiplier={multiplier}>
        <Initialize className="w-full h-full" />
      </AnimatedSVG>
    </div>
  );
}
