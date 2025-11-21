import Image from "next/image";
import type { CSSProperties } from "react";
import heroLogo from "@/public/img/optimized/herologo.webp";
import ScrollTransform from "@animations/ScrollTransform";
export default function HeroLogoText() {
  return (
    // <HalftoneEffect
    //   dotRadius={{ base: 2, md: 3 }}
    //   dotSpacing={{ base: 5, md: 10 }}
    //   className="HERO_LOGO_TEXT"
    //   shape="octagon"
    // >
    <div
      className="sticky top-0 w-full h-[clamp(3svh,57cqw,60svh)] max-w-(--container-width) mx-auto"
      style={
        {
          containerType: "size",
          maskImage: "url('/warped-halftone/halftone-hero.webp')",
          maskSize: "cover",
          maskPosition: "50% 50%",
          maskRepeat: "no-repeat",
        } as CSSProperties
      }
    >
      <ScrollTransform
        start={{ anchor: 0, viewport: 0 }}
        end={{ anchor: 0.85, viewport: 0 }}
        from={{ scaleY: 1 }}
        to={{ scaleY: 0.18 }}
        transformOrigin="50% 0%"
        willChange="transform"
        className="w-full h-full origin-[50%_0%]"
        style={{
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <h1 className="sr-only">PHANTOM DRUM</h1>

        <div className="px-10 py-6 h-full">
          <Image
            src={heroLogo}
            alt="Phantom Drum"
            priority
            width={1042}
            height={600}
            sizes="100vw"
            decoding="sync"
            className="relative object-contain w-full h-full skew-y-[0.5deg]"
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
