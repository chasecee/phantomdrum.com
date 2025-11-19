import Image from "next/image";
import type { CSSProperties } from "react";
import heroLogo from "@/public/img/optimized/herologo.webp";
import ScrollTransform from "@animations/ScrollTransform";
import HalftoneEffect from "../content/HalftoneEffect";
export default function HeroLogoText() {
  return (
    // <HalftoneEffect
    //   dotRadius={{ base: 2, md: 3 }}
    //   dotSpacing={{ base: 5, md: 10 }}
    //   className="HERO_LOGO_TEXT"
    //   shape="octagon"
    // >
    <div
      style={
        {
          containerType: "inline-size",
          maskImage: "url('/warped-halftone/vector/halftone-hero.svg')",
          maskSize: "100% 100%",
          maskPosition: "50% 50%",
          maskRepeat: "no-repeat",
        } as CSSProperties
      }
    >
      <ScrollTransform
        start={{ anchor: 0, viewport: 0 }}
        end={{ anchor: 0.82, viewport: 0 }}
        from={{ scaleY: 1 }}
        to={{ scaleY: 0.18 }}
        transformOrigin="50% 0%"
        willChange="transform"
        className="aspect-1042/600 origin-[50%_0%]"
        style={{
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <h1 className="sr-only">PHANTOM DRUM</h1>

        <div className="p-4">
          <Image
            src={heroLogo}
            alt="Phantom Drum"
            priority
            width={1042}
            height={600}
            sizes="100vw"
            decoding="sync"
            className="relative w-full max-h-[calc(80svh-4rem)] skew-y-[0.5deg]"
          />
        </div>
        {/* <h2 className="tracking-[0cqi] text-[7.5cqi] leading-[.8] mt-2 font-normal text-amber-400">
          INITIALIZE
        </h2> */}
      </ScrollTransform>
    </div>
    // </HalftoneEffect>
  );
}
