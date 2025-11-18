import ArtistBio from "../components/content/ArtistBio";
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
              maskImage: "linear-gradient(to top, rgba(0,0,0,0), black 20%)",
              maskSize: "100% 100%",
              maskPosition: "bottom",
              maskRepeat: "no-repeat",
            }}
            className=""
          >
            <div className="px-2 sticky top-2 z-10 mix-blend-overlay pointer-events-none">
              <HeroLogoText />
            </div>
            <HalftoneScene config={oneHalftoneSceneConfig} />
          </div>
          <CubeSection />
          <div className="h-[200vw] overflow-hidden relative w-full">
            <ArtistBio />
          </div>
        </div>
      </div>
      {process.env.NODE_ENV === "development" && <PerfHud />}
    </>
  );
}
