import Image from "next/image";
import type { CSSProperties } from "react";
import heroLogo from "@/public/img/optimized/herologo.webp";
import ScrubAnimation from "@animations/ScrubAnimation";
import HalftoneEffect from "../content/HalftoneEffect";
export default function HeroLogoText() {
  return (
    // <HalftoneEffect
    //   dotRadius={{ base: 2, md: 2 }}
    //   dotSpacing={{ base: 5, md: 8 }}
    //   className="HERO_LOGO_TEXT"
    // >
    <div
      style={
        {
          containerType: "inline-size",
        } as CSSProperties
      }
    >
      <ScrubAnimation
        from={{ scaleY: 1, force3D: true as const }}
        to={{ scaleY: 0.18, ease: "none", force3D: true as const }}
        scrollTrigger={{
          start: "0% top",
          end: "82% 0%",
          scrub: true,
          invalidateOnRefresh: true,
          markers: process.env.NODE_ENV === "development" ? true : false,
        }}
        containerProps={{
          className: "aspect-1042/600 origin-[50%_0%]",
          style: {
            willChange: "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          },
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
      </ScrubAnimation>
    </div>
    // </HalftoneEffect>
  );
}
