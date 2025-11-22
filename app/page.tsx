import CubeSection from "./components/sections/CubeSection";
import HalftoneEffect from "./components/content/HalftoneEffect";
import HeroHalftoneSection from "./components/sections/HeroHalftoneSection";
import type { CSSProperties } from "react";
import ArtistBio from "./components/content/ArtistBio";
import QuotesSection from "./components/content/QuotesSection";
import HeroLogoTextTwoColor from "./components/sections/HeroLogoTextTwoColor";
import HeroMeteors from "./components/sections/HeroMeteors";
import HeroLogoTextTwoColorReversed from "./components/sections/HeroLogoTextTwoColorReversed";
const HERO_SCALE_MULTIPLIER = 0.18;

export default function Page() {
  return (
    <div className="w-full">
      <div className="relative max-w-[1500px] mx-auto bg-linear-to-b from-slate-950/60 via-amber-900/20 to-transparent">
        <div
          style={
            {
              maskImage: "linear-gradient(to top, rgba(0,0,0,0), black 5%)",
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
          <HeroLogoTextTwoColor />

          <HeroHalftoneSection />
          <HeroLogoTextTwoColorReversed />
        </div>
        <CubeSection />
        <QuotesSection />
        <ArtistBio />
      </div>
    </div>
  );
}
