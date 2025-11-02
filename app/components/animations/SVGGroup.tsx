"use client";

import { useState, useEffect, useRef } from "react";
import AnimatedSVG from "./AnimatedSVG";
import Phantom from "../svgs/Phantom";
import Drum from "../svgs/Drum";
import Initialize from "../svgs/Initialize";

const aspectRatios = [462 / 84, 271 / 82, 515 / 43];

interface SVGGroupProps {
  onScrollHeightCalculated?: (height: number) => void;
}

export default function SVGGroup({ onScrollHeightCalculated }: SVGGroupProps) {
  const [multiplier, setMultiplier] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateMultiplier = () => {
      if (!containerRef.current) return;

      const viewportHeight = window.innerHeight;
      const containerWidth = containerRef.current.offsetWidth;

      const totalFinalHeight = aspectRatios.reduce(
        (sum, ratio) => sum + containerWidth / ratio,
        0
      );

      const calculated = (viewportHeight * 0.95) / totalFinalHeight;
      const newMultiplier = Math.max(1, calculated);
      setMultiplier(newMultiplier);

      const totalScrollDistance = aspectRatios.reduce(
        (sum, ratio) => sum + (containerWidth / ratio) * newMultiplier,
        0
      );

      onScrollHeightCalculated?.(totalScrollDistance + totalFinalHeight);
    };

    calculateMultiplier();
    window.addEventListener("resize", calculateMultiplier);
    return () => window.removeEventListener("resize", calculateMultiplier);
  }, [onScrollHeightCalculated]);

  return (
    <div ref={containerRef} className="flex flex-col">
      <AnimatedSVG
        order={0}
        aspectRatio={aspectRatios[0]}
        multiplier={multiplier}
      >
        <Phantom className="w-full h-full" />
      </AnimatedSVG>
      <AnimatedSVG
        order={1}
        aspectRatio={aspectRatios[1]}
        multiplier={multiplier}
      >
        <Drum className="w-full h-full" />
      </AnimatedSVG>
      <AnimatedSVG
        order={2}
        aspectRatio={aspectRatios[2]}
        multiplier={multiplier}
      >
        <Initialize className="w-full h-full" />
      </AnimatedSVG>
    </div>
  );
}
