"use client";

import { useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimatedHalftoneMask from "./AnimatedHalftoneMask";
import { useRGBChannels } from "./useRGBChannels";
import { useChannelAlignment } from "./useChannelAlignment";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const START_RADIUS = 5;
const END_RADIUS = 0.1;

const START_OFFSET = START_RADIUS * 4;
const END_OFFSET = 0;

const START_SPACING = START_RADIUS * 3;
const END_SPACING = 0.1;
const SCROLL_START = "40% 100%";
const SCROLL_END = "60% 0%";

export default function RGBChannelHalftone() {
  const channels = useRGBChannels("/img/chase.png");
  const channelBlendStyle = useMemo<CSSProperties>(
    () => ({
      mixBlendMode: "lighten",
      willChange: "transform",
    }),
    []
  );

  const redChannelRef = useRef<HTMLDivElement>(null);
  const greenChannelRef = useRef<HTMLDivElement>(null);
  const blueChannelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useChannelAlignment(
    {
      red: redChannelRef,
      green: greenChannelRef,
      blue: blueChannelRef,
      container: containerRef,
    },
    START_OFFSET,
    END_OFFSET,
    !!channels,
    SCROLL_START,
    SCROLL_END
  );

  if (!channels) return null;

  return (
    <div ref={containerRef} className="min-h-[600vh] w-full bg-black relative">
      <div className="sticky top-0 h-svh w-full flex items-center justify-center">
        <div
          className="relative w-full h-full"
          style={{ isolation: "isolate" }}
        >
          <div
            ref={redChannelRef}
            className="absolute inset-0 pointer-events-none"
            style={channelBlendStyle}
          >
            <AnimatedHalftoneMask
              containerRef={containerRef}
              imageSrc={channels.red}
              startRadius={START_RADIUS}
              endRadius={END_RADIUS}
              startSpacing={START_SPACING}
              endSpacing={END_SPACING}
              scrollStart={SCROLL_START}
              scrollEnd={SCROLL_END}
              className="relative w-full h-full"
            />
          </div>

          <div
            ref={greenChannelRef}
            className="absolute inset-0 pointer-events-none"
            style={channelBlendStyle}
          >
            <AnimatedHalftoneMask
              containerRef={containerRef}
              imageSrc={channels.green}
              startRadius={START_RADIUS}
              endRadius={END_RADIUS}
              startSpacing={START_SPACING}
              endSpacing={END_SPACING}
              scrollStart={SCROLL_START}
              scrollEnd={SCROLL_END}
              className="relative w-full h-full"
              showMarkers={true}
            />
          </div>

          <div
            ref={blueChannelRef}
            className="absolute inset-0 pointer-events-none"
            style={channelBlendStyle}
          >
            <AnimatedHalftoneMask
              containerRef={containerRef}
              imageSrc={channels.blue}
              startRadius={START_RADIUS}
              endRadius={END_RADIUS}
              startSpacing={START_SPACING}
              endSpacing={END_SPACING}
              scrollStart={SCROLL_START}
              scrollEnd={SCROLL_END}
              className="relative w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
