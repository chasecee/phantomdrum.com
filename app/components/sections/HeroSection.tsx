"use client";

import CombinedLogo from "../svgs/CombinedLogo";
import Image from "next/image";
import styles from "./HeroSection.module.css";
import HalftoneEffect from "../content/HalftoneEffect";

export default function HeroSection() {
  return (
    <div className="relative aspect-1/2 w-full">
      <div className="sticky top-6 z-10 mix-blend-difference px-6">
        <div
          className="relative w-full aspect-887/488"
          style={{ overflow: "visible" }}
        >
          <HalftoneEffect blur={0} dotRadius={2} dotSpacing={4}>
            <div
              className={`w-full h-full text-neutral-300 ${styles.heroLogo}`}
            >
              <CombinedLogo className="w-full h-full" />
            </div>
          </HalftoneEffect>
        </div>
      </div>

      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className={`absolute inset-0 aspect-square w-full ${styles.heroImage}`}
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
        </div>
      </div>
    </div>
  );
}
