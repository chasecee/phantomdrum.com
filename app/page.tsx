"use client";

import HeroSectionText from "./components/sections/HeroSectionText";
import CubeSection from "./components/sections/CubeSection";
import QuotesSection from "./components/content/QuotesSection";
import ArtistBio from "./components/content/ArtistBio";
import ListenSection from "./components/content/ListenSection";
import { AnimatedPolyColumnScene } from "./components/content/three/AnimatedPolyColumnScene";
import { RefObject, useRef } from "react";

const POLY_COLUMN_TEXTS = [
  "DRUMS",
  "SYNTHS",
  "SAMPLES",
  "FX",
  "LOOPS",
  "TEXTURES",
  "ATMOS",
  "SAMPLERS",
  "LOVE LOOPS!",
  "LOVE TEXTURES!",
  "LOVE ATMOS!",
  "LOVE LOOPS!",
  "LOVE TEXTURES!",
  "LOVE ATMOS!",
];

export default function Home() {
  const polyColumnSectionRef = useRef<HTMLElement>(null);

  return (
    <div
      className="w-full max-w-[1500px] mx-auto body-container"
      style={{
        backgroundImage: "url(/img/optimized/noise.webp)",
        backgroundSize: "min(100%, 1128px)",
        backgroundPosition: "center",
        containerType: "inline-size",
      }}
    >
      <HeroSectionText />
      <div className="mix-blend-difference">
        <CubeSection />
      </div>
      <QuotesSection />
      <ListenSection />
      <ArtistBio />
      <section
        ref={polyColumnSectionRef}
        className="aspect-square w-full relative flex items-center justify-center"
      >
        <AnimatedPolyColumnScene
          texts={POLY_COLUMN_TEXTS}
          trigger={polyColumnSectionRef as RefObject<HTMLElement>}
          start="top bottom"
          end="bottom top"
          scrub={1}
          from={{ rotation: { x: 0, y: 0, z: 0 }, scale: 1 }}
          to={{
            rotation: { x: 0, y: Math.PI * 2.9, z: 0 },
            scale: 1,
          }}
          radius={4}
          height={4}
          textSize={0.25}
          strokeWidth={5}
          cameraPosition={[0, 0, 20]}
          cameraFov={25}
          className="w-full h-full"
        />
      </section>
      <div className="h-[100vw] w-full" />
    </div>
  );
}
