import ArtistBio from "../components/content/ArtistBio";
import HalftoneEffect from "../components/content/HalftoneEffect";
import CubeSection from "../components/sections/CubeSection";
import HeroLogoText from "../components/sections/HeroLogoText";
import { HalftoneScene } from "./halftone/HalftoneScene";
import { oneHalftoneSceneConfig } from "./halftone/sceneConfig";
import { PerfHud } from "../components/dev/PerfHud";

export default function OnePage() {
  return (
    <>
      <div className="w-full">
        <div className="relative max-w-[1500px] mx-auto bg-linear-to-b from-slate-950/60 to-amber-900/20">
          <div
            style={{
              maskImage: "linear-gradient(to top, transparent, black 15%)",
              maskSize: "100% 100%",
              maskPosition: "bottom",
              maskRepeat: "no-repeat",
            }}
            className="relative"
          >
            <div className="px-6 sticky top-6 z-10 mix-blend-plus-lighter pointer-events-none">
              <HalftoneEffect dotRadius={2} dotSpacing={4}>
                <HeroLogoText />
              </HalftoneEffect>
            </div>
            <div className="mt-12">
              <HalftoneScene config={oneHalftoneSceneConfig} />
            </div>
          </div>
          <CubeSection />
          <div className="h-[200vw] overflow-hidden relative w-full">
            <ArtistBio />
          </div>
        </div>
      </div>
      <PerfHud />
    </>
  );
}
