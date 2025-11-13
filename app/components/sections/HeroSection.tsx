"use client";

import CombinedLogo from "../svgs/CombinedLogo";
import Image from "next/image";
import styles from "./HeroSection.module.css";

export default function HeroSection() {
  return (
    <div className="relative aspect-1/2 w-full">
      <div className="sticky top-6 z-10 mix-blend-difference px-6">
        <div
          className="relative w-full aspect-887/488"
          style={{ overflow: "visible" }}
        >
          <div className={`w-full h-full text-neutral-200 ${styles.heroLogo}`}>
            <CombinedLogo className="w-full h-full" />
          </div>
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
