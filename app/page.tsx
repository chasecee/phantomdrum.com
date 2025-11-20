import CubeSection from "./components/sections/CubeSection";
import HalftoneEffect from "./components/content/HalftoneEffect";
import HeroHalftoneSection from "./components/sections/HeroHalftoneSection";
import HeroLogoTextMask from "./components/sections/HeroLogoTextMask";
import type { CSSProperties } from "react";
import ArtistBio from "./components/content/ArtistBio";
import QuotesSection from "./components/content/QuotesSection";
const HERO_SCALE_MULTIPLIER = 0.18;

export default function Page() {
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
            } as CSSProperties
          }
        >
          <HeroLogoTextMask />
          <HalftoneEffect
            dotRadius={1}
            dotSpacing={5}
            className="HERO_BACKGROUND pointer-events-none"
            applyToChild
          >
            <div
              className={`absolute overflow-hidden left-[15vw] right-[5] top-0 h-[100vw] opacity-30 ${
                process.env.NODE_ENV === "development"
                  ? "border-2 border-red-500"
                  : ""
              }`}
            >
              <div
                className="absolute inset-0 saturate-150  brightness-200 blur-lg "
                style={{
                  maskImage:
                    "linear-gradient(to bottom, transparent, black 60%, black 90%,transparent)",
                  maskSize: "100% 100%",
                  maskPosition: "top",
                  maskRepeat: "no-repeat",
                }}
              >
                <div
                  className="absolute z-3 top-0 left-[50%] -translate-x-[45%] h-full w-[80%]"
                  style={{
                    backgroundImage: "url('/img/optimized/linesbg.webp')",
                    backgroundSize: "100% 10%",
                    backgroundPosition: "50% 50%",
                    backgroundRepeat: "repeat-y",
                    backgroundColor: "green",
                    backgroundBlendMode: "screen",
                    maskImage: "url('/img/optimized/linesbg.webp')",
                    maskSize: "100% 20%",
                    maskPosition: "50% 50%",
                    maskRepeat: "repeat-y",
                  }}
                />
                <div
                  className="absolute z-4 top-0 left-[50%] mix-blend-overlay -translate-x-[50%] h-full w-[80%]"
                  style={{
                    backgroundImage: "url('/img/optimized/linesbg.webp')",
                    backgroundSize: "100% 10%",
                    backgroundPosition: "50% 50%",
                    backgroundRepeat: "repeat-y",
                    backgroundColor: "blue",
                    backgroundBlendMode: "screen",
                    maskImage: "url('/img/optimized/linesbg.webp')",
                    maskSize: "100% 20%",
                    maskPosition: "50% 50%",
                    maskRepeat: "repeat-y",
                  }}
                />
                <div
                  className="absolute z-5 top-0 left-[50%] mix-blend-overlay -translate-x-[55%]  h-full   w-[80%]"
                  style={{
                    backgroundImage: "url('/img/optimized/linesbg.webp')",
                    backgroundSize: "100% 10px",
                    backgroundPosition: "50% 50%",
                    backgroundRepeat: "repeat-y",
                    backgroundColor: "red",
                    backgroundBlendMode: "screen",
                    maskImage: "url('/img/optimized/linesbg.webp')",
                    maskSize: "100% 100%",
                    maskPosition: "50% 50%",
                    maskRepeat: "repeat-y",
                  }}
                />
              </div>
            </div>
          </HalftoneEffect>
          <HeroHalftoneSection />
        </div>
        <CubeSection />
        <QuotesSection />
        <ArtistBio />
      </div>
    </div>
  );
}
