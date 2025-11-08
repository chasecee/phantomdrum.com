"use client";

import { RefObject, useRef } from "react";
import SVGGroup from "../../art/SVGGroup";
import ScrubAnimation from "../animations/ScrubAnimation";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={containerRef} className="relative aspect-1/2 w-full">
      <div
        className="sticky top-6 z-10 mix-blend-difference px-6"
        style={{ contain: "layout style", overflow: "visible" }}
      >
        <SVGGroup />
      </div>

      <div className="absolute inset-0 w-full overflow-hidden">
        <ScrubAnimation
          trigger={containerRef as RefObject<HTMLElement>}
          start="top top"
          end="bottom 10%"
          scrub={1}
          from={{ scale: 1.5, yPercent: 100 }}
          to={{ scale: 2.5, yPercent: 40 }}
          className="origin-[50%_50%]"
          showMarkers={false}
          invalidateOnRefresh={false}
        >
          <div
            className="aspect-square h-full w-full bg-cover scale-[1.1]"
            style={{
              backgroundImage: "url(/img/optimized/no-bg.webp)",
              backgroundPosition: "50% 50%",
            }}
          />
        </ScrubAnimation>
      </div>
    </div>
  );
}

