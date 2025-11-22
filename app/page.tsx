import CubeSection from "./components/sections/CubeSection";
import HalftoneEffect from "./components/content/HalftoneEffect";
import HeroHalftoneSection from "./components/sections/HeroHalftoneSection";
import type { CSSProperties } from "react";
import ArtistBio from "./components/content/ArtistBio";
import QuotesSection from "./components/content/QuotesSection";
import HeroLogoTextTwoColor from "./components/sections/HeroLogoTextTwoColor";
import HeroMeteors from "./components/sections/HeroMeteors";
import HeroLogoTextTwoColorReversed from "./components/sections/HeroLogoTextTwoColorReversed";
import ListenSection from "./components/content/ListenSection";
const HERO_SCALE_MULTIPLIER = 0.18;

export default function Page() {
  return (
    <div className="w-full">
      <div className="relative max-w-[1500px] mx-auto bg-linear-to-b from-slate-950/60 via-amber-900/20 to-transparent">
        <div
          style={
            {
              //maskImage: "linear-gradient(to top, rgba(0,0,0,0), black 5%)",
              maskSize: "100% 100%",
              maskPosition: "bottom",
              maskRepeat: "no-repeat",
              containerType: "inline-size",
              "--aspect-width": "1042",
              "--aspect-height": "600",
              "--scale-multiplier": `${HERO_SCALE_MULTIPLIER}`,
              "--aspect-ratio":
                "calc(var(--aspect-width)/var(--aspect-height))",
            } as CSSProperties
          }
        >
          <HeroMeteors />
          <HeroLogoTextTwoColorReversed />

          <HeroHalftoneSection />
          <HeroLogoTextTwoColor />
        </div>
        <CubeSection />
        <HalftoneEffect
          dotRadius={{ base: 1.5, md: 3 }}
          dotSpacing={{ base: 3, md: 5 }}
          shape="octagon"
          className="OUT_NOW_TEXT pointer-events-none mt-[20vw] mb-[11vw]"
        >
          <div className="text-[10cqw] space-y-[.5em] tracking-[0.1em] scale-[.9] skew-y-[.5deg] origin-[50%_0%] text-center  leading-[0.8] font-bold">
            <span className="text-[.75em] block">
              Out Nov 24<sup className="text-[.6em]">TH</sup>
            </span>
            <span className="text-[.75em] block">Presave Now</span>
          </div>
        </HalftoneEffect>
        <ListenSection />

        <QuotesSection />
        <ArtistBio />
      </div>
    </div>
  );
}
