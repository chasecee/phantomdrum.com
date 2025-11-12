"use client";

import { useRef } from "react";
import ScrollTransform from "../animations/ScrollTransform";
import CombinedLogo from "../svgs/CombinedLogo";
import Image from "next/image";

const LOGO_START = { anchor: 0, viewport: 0 } as const;
const LOGO_END = { anchor: 0.2, viewport: 0 } as const;
const LOGO_FROM = { scaleY: 2 } as const;
const LOGO_TO = { scaleY: 1 } as const;

const HERO_IMAGE_START = { anchor: 0, viewport: 0 } as const;
const HERO_IMAGE_END = { anchor: 0.9, viewport: 0 } as const;
const HERO_IMAGE_FROM = { scale: 1, translateYPercent: 120 } as const;
const HERO_IMAGE_TO = { scale: 1.5, translateYPercent: 50 } as const;

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative aspect-1/2 w-full border-b-8 border-white"
    >
      <div className="sticky top-6 z-10 mix-blend-difference px-6">
        <div
          className="relative w-full aspect-887/488"
          style={{ overflow: "visible" }}
        >
          <ScrollTransform
            anchorRef={containerRef}
            start={LOGO_START}
            end={LOGO_END}
            from={LOGO_FROM}
            to={LOGO_TO}
            className="w-full h-full text-neutral-200"
            transformOrigin="top center"
            viewportMode="none"
          >
            <CombinedLogo className="w-full h-full" />
          </ScrollTransform>
        </div>
      </div>

      <div className="absolute inset-0 z-0 overflow-hidden">
        <ScrollTransform
          anchorRef={containerRef}
          start={HERO_IMAGE_START}
          end={HERO_IMAGE_END}
          from={HERO_IMAGE_FROM}
          to={HERO_IMAGE_TO}
          className="aspect-square  w-full origin-[50%_50%] absolute inset-0"
          transformOrigin="50% 100%"
          viewportMode="none"
        >
          <Image
            src="/img/optimized/planet-cropped.webp"
            alt="Phantom Drum Globe"
            fill
            className="object-cover object-center"
            priority
            fetchPriority="high"
            sizes="100vw"
          />
        </ScrollTransform>
      </div>
    </div>
  );
}
