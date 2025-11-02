"use client";

import AnimatedSVG from "./AnimatedSVG";
import Phantom from "../svgs/Phantom";
import Drum from "../svgs/Drum";
import Initialize from "../svgs/Initialize";

const aspectRatios = [462 / 84, 271 / 82, 515 / 43];
const multiplier = 2;

export default function SVGGroup() {
  return (
    <div className="flex flex-col">
      <AnimatedSVG aspectRatio={aspectRatios[0]} multiplier={multiplier}>
        <Phantom className="w-full h-full" />
      </AnimatedSVG>
      <AnimatedSVG aspectRatio={aspectRatios[1]} multiplier={multiplier}>
        <Drum className="w-full h-full" />
      </AnimatedSVG>
      <AnimatedSVG aspectRatio={aspectRatios[2]} multiplier={1}>
        <Initialize className="w-full h-full" />
      </AnimatedSVG>
    </div>
  );
}
