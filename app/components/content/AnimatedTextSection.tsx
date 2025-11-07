import ScaleText from "./ScaleText";
import ScrubAnimation from "../animations/ScrubAnimation";
import { RefObject, useRef } from "react";

export default function AnimatedTextSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="relative overflow-hidden">
      <div className="relative px-[10vw] mx-auto">
        <div
          ref={containerRef}
          className="space-y-16 leading-none relative text-[4vw] font-[150] text-white/50 mix-blend-difference"
        >
          <div className="mt-[10vw] mb-[8vw] origin-[50%_50%] -skew-x-2 -skew-y-3">
            <div className="text-balance font-mono font-bold uppercase bg-clip-text text-white">
              <ScrubAnimation
                trigger={containerRef as RefObject<HTMLElement>}
                start="50% 100%"
                end="50% 0%"
                scrub={2}
                from={{ xPercent: -2 }}
                to={{ xPercent: 5 }}
                className="origin-[50%_50%]"
                showMarkers={false}
              >
                <ScaleText>Ghost-grade farm-fresh</ScaleText>
              </ScrubAnimation>
              <ScrubAnimation
                trigger={containerRef as RefObject<HTMLElement>}
                start="50% 100%"
                end="50% 0%"
                scrub={3}
                from={{ xPercent: 5 }}
                to={{ xPercent: -2 }}
                className="origin-[50%_50%]"
                showMarkers={false}
              >
                <ScaleText>ABSTRACT YET, FAMILIAR</ScaleText>
              </ScrubAnimation>
              <ScrubAnimation
                trigger={containerRef as RefObject<HTMLElement>}
                start="100% 90%"
                end="0% 30%"
                scrub={1}
                from={{ xPercent: 0 }}
                to={{ xPercent: -2 }}
                className="origin-[50%_50%]"
                showMarkers={false}
              >
                <ScaleText className="text-white">
                  ENYA POWERED ORCHESTRAL
                </ScaleText>
              </ScrubAnimation>
              <ScrubAnimation
                trigger={containerRef as RefObject<HTMLElement>}
                start="100% 90%"
                end="0% 30%"
                scrub={1}
                from={{ xPercent: -2 }}
                to={{ xPercent: 2 }}
                className="origin-[50%_50%]"
                showMarkers={false}
              >
                <ScaleText className="text-white">SUNDAY DINNER</ScaleText>
              </ScrubAnimation>
              <ScrubAnimation
                trigger={containerRef as RefObject<HTMLElement>}
                start="100% 90%"
                end="0% 30%"
                scrub={1}
                from={{ xPercent: 5 }}
                to={{ xPercent: -4 }}
                className="origin-[50%_50%]"
                showMarkers={false}
              >
                <ScaleText className="text-white">MEGA BEATS</ScaleText>
              </ScrubAnimation>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
