"use client";

import type { CSSProperties } from "react";
import ScrollTransform from "../animations/ScrollTransform";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import heroLogo from "@/public/img/optimized/herologo.webp";

export default function HeroLogoTextMask() {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [initialScaleY, setInitialScaleY] = useState(1);
  const lastWidthRef = useRef(0);

  useEffect(() => {
    const calculateScale = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const containerHeight = Math.min(vw * 0.8, vh * 0.5);
      const targetScale = Math.min(vh / containerHeight, 1);
      setInitialScaleY(targetScale);
      lastWidthRef.current = vw;
    };

    const handleResize = () => {
      const widthDiff = Math.abs(window.innerWidth - lastWidthRef.current);
      if (widthDiff > 100) {
        calculateScale();
      }
    };

    calculateScale();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={anchorRef}
      className={`relative z-1 h-[80vw] max-h-[50svh] mb-[max(-25vw,-25svh)] min-h-[33svh] ${
        process.env.NODE_ENV === "development"
          ? "border-2  border-white-500/0 border-dashed"
          : ""
      }`}
      style={
        {
          containerType: "inline-size",
          maskImage: "url('/warped-halftone/halftone-hero.webp')",
          maskSize: "100% 100%",
          maskPosition: "50% 50%",
          maskRepeat: "no-repeat",
        } as CSSProperties
      }
    >
      <div
        className="relative h-[calc(200cqh)] max-h-svh"
        style={
          {
            maskImage: "linear-gradient(to bottom, black 50%, transparent 55%)",
            maskSize: "cover",
            maskPosition: "50% 50%",
            maskRepeat: "repeat",
          } as CSSProperties
        }
      >
        <div className="sticky top-0 max-h-[100cqh]">
          <ScrollTransform
            start={{ anchor: 0, viewport: 0 }}
            end={{ anchor: 0.8, viewport: 0 }}
            from={{ scaleY: 1 }}
            to={{ scaleY: initialScaleY * 0.18 }}
            transformOrigin="50% 0%"
            willChange="transform"
            className="relative w-full"
            anchorRef={anchorRef}
          >
            <h1 className="sr-only text-[13.5cqi] leading-[0.8] font-bold text-white">
              PHANTOM DRUM
            </h1>
            <Image
              src={heroLogo}
              alt="Phantom Drum"
              width={1042}
              height={600}
              fetchPriority="high"
              className="w-full max-h-[50svh] max-w-none object-contain object-center"
            />
          </ScrollTransform>
        </div>
      </div>
    </div>
  );
}
