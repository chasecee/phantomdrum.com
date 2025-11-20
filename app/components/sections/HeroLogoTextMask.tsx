import type { CSSProperties } from "react";
import ScrollTransform from "../animations/ScrollTransform";
import { useRef } from "react";
import Image from "next/image";
import heroLogo from "@/public/img/optimized/herologo.webp";
export default function HeroLogoText() {
  const anchorRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={anchorRef}
      className={`relative z-1 h-[100vw] mb-[-25vw] ${
        process.env.NODE_ENV === "development"
          ? "border-2  border-white-500 border-dashed"
          : ""
      }`}
      style={
        {
          containerType: "inline-size",
          maskImage: "url('/warped-halftone/vector/halftone-hero.svg')",
          maskSize: "cover",
          maskPosition: "50% 50%",
          maskRepeat: "repeat",
        } as CSSProperties
      }
    >
      <div
        className="relative p-4 h-[200%]"
        style={
          {
            maskImage: "linear-gradient(to bottom, black 40%, transparent 50%)",
            maskSize: "100% 100%",
            maskPosition: "50% 50%",
            maskRepeat: "repeat",
          } as CSSProperties
        }
      >
        <div className="sticky top-2">
          <ScrollTransform
            start={{ anchor: 0, viewport: 0 }}
            end={{ anchor: 0.7, viewport: 0 }}
            from={{ scaleY: 1 }}
            to={{ scaleY: 0.18 }}
            transformOrigin="50% 0%"
            willChange="transform"
            className="aspect-1042/600 origin-[50%_0%] relative p-1"
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
              className="w-full h-full max-w-[98%] mx-auto object-contain object-center"
            />
          </ScrollTransform>
        </div>
      </div>
    </div>
  );
}
