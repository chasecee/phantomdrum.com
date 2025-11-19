import ArtistBio from "./components/content/ArtistBio";
import QuotesSection from "./components/content/QuotesSection";
import { HalftoneScene } from "./components/halftone/HalftoneScene";
import CubeSection from "./components/sections/CubeSection";
import HeroLogoText from "./components/sections/HeroLogoText";
import { experienceHalftoneSceneConfig } from "./components/halftone/sceneConfig";
import HalftoneEffect from "./components/content/HalftoneEffect";
const HERO_SCALE_MULTIPLIER = 0.18;

export default function Page() {
  return (
    <div className="w-full overflow-hidden">
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
          <div className="HERO_TITLE px-2 sticky top-0 z-4 pointer-events-none">
            <HeroLogoText />
          </div>
          <HalftoneEffect
            dotRadius={1}
            dotSpacing={5}
            className="HERO_BACKGROUND"
            applyToChild
          >
            <div
              className={`absolute left-[15vw] right-[-5] top-0 h-[100vw] opacity-30 ${
                process.env.NODE_ENV === "development"
                  ? "border-2 border-red-500"
                  : ""
              }`}
            >
              <div
                className="absolute inset-0 saturate-150  brightness-200 contrast-150"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, transparent, black 60%, black 90%,transparent)",
                  maskSize: "100% 100%",
                  maskPosition: "top",
                  maskRepeat: "no-repeat",
                }}
              >
                <div
                  className="absolute z-3 top-0 left-[50%] mix-blend-screen -translate-x-[45%] h-full w-[80%]"
                  style={{
                    backgroundImage: "url('/img/optimized/linesbg.webp')",
                    backgroundSize: "100% 10%",
                    backgroundPosition: "50% 50%",
                    backgroundRepeat: "repeat-y",
                    backgroundColor: "green",
                    backgroundBlendMode: "multiply",
                    maskImage: "url('/img/optimized/linesbg.webp')",
                    maskSize: "100% 20%",
                    maskPosition: "50% 50%",
                    maskRepeat: "repeat-y",
                  }}
                />
                <div
                  className="absolute z-4 top-0 left-[50%] mix-blend-screen -translate-x-[50%] h-full w-[80%]"
                  style={{
                    backgroundImage: "url('/img/optimized/linesbg.webp')",
                    backgroundSize: "100% 10%",
                    backgroundPosition: "50% 50%",
                    backgroundRepeat: "repeat-y",
                    backgroundColor: "blue",
                    backgroundBlendMode: "multiply",
                    maskImage: "url('/img/optimized/linesbg.webp')",
                    maskSize: "100% 20%",
                    maskPosition: "50% 50%",
                    maskRepeat: "repeat-y",
                  }}
                />
                <div
                  className="absolute z-5 top-0 left-[50%] mix-blend-screen -translate-x-[55%]  h-full   w-[80%]"
                  style={{
                    backgroundImage: "url('/img/optimized/linesbg.webp')",
                    backgroundSize: "100% 10px",
                    backgroundPosition: "50% 50%",
                    backgroundRepeat: "repeat-y",
                    backgroundColor: "red",
                    backgroundBlendMode: "multiply",
                    maskImage: "url('/img/optimized/linesbg.webp')",
                    maskSize: "100% 100%",
                    maskPosition: "50% 50%",
                    maskRepeat: "repeat-y",
                  }}
                />
              </div>
            </div>
          </HalftoneEffect>
          <HalftoneScene config={experienceHalftoneSceneConfig} />
        </div>
        <CubeSection />
        <div className="h-[200vw] overflow-hidden relative w-full">
          <ArtistBio />
        </div>
      </div>
      <div className="max-w-[1500px] mx-auto pt-16">
        <QuotesSection />
      </div>
    </div>
  );
}
