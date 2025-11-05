"use client";

import AnimatedSVG from "../components/animations/AnimatedSVG";
import CombinedLogo from "../components/svgs/CombinedLogo";

const aspectRatio = 887 / 449;
const multiplier = 2;

export default function SVGGroup() {
  return (
    <div
      className="relative w-full aspect-887/449"
      style={{ overflow: "visible" }}
    >
      <AnimatedSVG
        aspectRatio={aspectRatio}
        aspectRatios={[aspectRatio]}
        multiplier={multiplier}
        index={0}
        gap={0}
        heightPercent={100}
        className="text-neutral-200"
      >
        <CombinedLogo className="w-full h-full" />
      </AnimatedSVG>
    </div>
  );
}
