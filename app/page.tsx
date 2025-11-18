import ArtistBio from "./components/content/ArtistBio";
import QuotesSection from "./components/content/QuotesSection";
import { PerfHud } from "./components/dev/PerfHud";
import { HalftoneScene } from "./components/halftone/HalftoneScene";
import type { HalftoneSceneConfig } from "./components/halftone/types";
import CubeSection from "./components/sections/CubeSection";
import HeroLogoText from "./components/sections/HeroLogoText";
import { experienceHalftoneSceneConfig } from "./components/halftone/sceneConfig";

const HERO_SCALE_MULTIPLIER = 0.18;

type ExperienceContentProps = {
  halftoneConfig: HalftoneSceneConfig;
  includeQuotes?: boolean;
};

export function ExperienceContent({
  halftoneConfig,
  includeQuotes = false,
}: ExperienceContentProps) {
  return (
    <div className="w-full">
      <div className="relative max-w-[1500px] mx-auto bg-linear-to-b from-slate-950/60 via-amber-900/20 to-transparent">
        <div
          style={
            {
              maskImage: "linear-gradient(to top, rgba(0,0,0,0), black 20%)",
              maskSize: "100% 100%",
              maskPosition: "bottom",
              maskRepeat: "no-repeat",
              containerType: "inline-size",
              "--aspect-width": "1042",
              "--aspect-height": "600",
              "--scale-multiplier": `${HERO_SCALE_MULTIPLIER}`,
              "--aspect-ratio":
                "calc(var(--aspect-width)/var(--aspect-height))",
            } as React.CSSProperties
          }
        >
          <div className="px-2 sticky top-0 z-4 mix-blend-overlay pointer-events-none">
            <HeroLogoText />
          </div>
          <HalftoneScene config={halftoneConfig} />
        </div>
        <CubeSection />
        <div className="h-[200vw] overflow-hidden relative w-full">
          <ArtistBio />
        </div>
      </div>
      {includeQuotes ? (
        <div className="max-w-[1500px] mx-auto pt-16">
          <QuotesSection />
        </div>
      ) : null}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <ExperienceContent
        halftoneConfig={experienceHalftoneSceneConfig}
        includeQuotes={true}
      />
      {process.env.NODE_ENV === "development" && <PerfHud />}
    </>
  );
}
