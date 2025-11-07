"use client";

import { RefObject, useRef } from "react";
import SVGGroup from "./art/SVGGroup";
import BackgroundSection from "./art/BackgroundSection";
import ScrubAnimation from "./components/animations/ScrubAnimation";
import ListenSection from "./components/content/ListenSection";
import QuotesSection from "./components/content/QuotesSection";
import AnimatedTextSection from "./components/content/AnimatedTextSection";
import ArtistBio from "./components/content/ArtistBio";
import AnimatedTextCube from "./components/content/AnimatedTextCube";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cubeContainerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className="w-full max-w-[1500px] mx-auto body-container"
      style={{
        backgroundImage: "url(/img/noise.png)",
        backgroundSize: "100cqi",
        backgroundPosition: "center",
        containerType: "inline-size",
      }}
    >
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
            <BackgroundSection position="50%_50%" className="aspect-square" />
          </ScrubAnimation>
        </div>
      </div>
      <ListenSection />
      <div className="w-full">
        <QuotesSection />
        <div
          ref={cubeContainerRef}
          className="aspect-3/1 w-full relative mix-blend-difference "
        >
          <AnimatedTextCube
            texts={[
              "GHOST GRADE FARM-FRESH",
              "ABSTRACT YET, FAMILIAR",
              "ENYA POWERED SUNDAY DINNER",
              "MEGA BEATS",
            ]}
            trigger={cubeContainerRef as RefObject<HTMLElement>}
            start="50% 70%"
            end="50% 30%"
            scrub={1}
            from={{ rotation: { x: 0, y: 0, z: 0 }, scale: 1 }}
            to={{
              rotation: { x: 0, y: -Math.PI * 1.5, z: 0 },
              scale: 1,
            }}
            showMarkers={true}
            className="absolute inset-0"
            heightRatio={0.33}
            size={2}
            materialType="basic"
          />
        </div>
        <ArtistBio />

        <div className="h-[100vw] w-full" />
      </div>
    </div>
  );
}
