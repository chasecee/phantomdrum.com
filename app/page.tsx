"use client";

import { RefObject, useRef } from "react";
import SVGGroup from "./art/SVGGroup";
import BackgroundSection from "./art/BackgroundSection";
import ScrubAnimation from "./components/animations/ScrubAnimation";
import ListenSection from "./components/content/ListenSection";
import QuotesSection from "./components/content/QuotesSection";
import ArtistBio from "./components/content/ArtistBio";
import AnimatedMultiCube from "./components/content/AnimatedMultiCube";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const multiCubeContainerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className="w-full max-w-[1500px] mx-auto body-container"
      style={{
        backgroundImage: "url(/img/noise.png)",
        backgroundSize: "1128px",
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
          ref={multiCubeContainerRef}
          className="aspect-[1.5/1] w-full relative mix-blend-screen"
        >
          <AnimatedMultiCube
            texts={[
              "GHOST GRADE",
              "FARM-FRESH",
              "ABSTRACT YET FAMILIAR",
              "CLASSIC SUNDAY DINNER",
              "BIG OL BEATS",
            ]}
            trigger={multiCubeContainerRef as RefObject<HTMLElement>}
            start="40% 80%"
            end="60% 20%"
            from={{ rotation: { x: 0.01, y: 0, z: 0 } }}
            to={{
              rotation: { x: -0.01, y: -Math.PI * 0.5, z: 0 },
            }}
            className="absolute inset-0"
            heightRatio={0.175}
            widthRatio={1.1}
            size={3}
            spacing={0.1}
            stagger={true}
            staggerDelay={0.1}
            fillMode="outline"
            strokeWidth={10}
            matchTextColor={true}
          />
        </div>

        <ArtistBio />

        <div className="h-[100vw] w-full" />
      </div>
    </div>
  );
}
