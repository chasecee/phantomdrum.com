import HeroLogoText from "../components/sections/HeroLogoText";
import { HalftoneScrollSection } from "./HalftoneScrollSection";
import ArtistBio from "../components/content/ArtistBio";
import CubeSection from "../components/sections/CubeSection";
import HalftoneEffect from "../components/content/HalftoneEffect";
export default function HalftoneWebGLDemoPage() {
  return (
    <div
      className="w-full"
      style={{
        backgroundImage: "url(/img/optimized/noise.webp)",
        backgroundSize: "min(100%, 1128px)",
        backgroundPosition: "center",
        containerType: "inline-size",
      }}
    >
      <div className="relative max-w-[1500px] mx-auto bg-linear-to-b from-slate-900/20 to-amber-800/20 ">
        <div
          className=""
          style={{
            maskImage: "linear-gradient(to top, transparent, black 25%)",
            maskSize: "100% 100%",
            maskPosition: "bottom",
            maskRepeat: "no-repeat",
          }}
        >
          <div className="px-6 sticky h-0 top-6  z-1 mix-blend-plus-lighter">
            <HalftoneEffect dotRadius={2} dotSpacing={4}>
              <HeroLogoText />
            </HalftoneEffect>
          </div>
          <HalftoneScrollSection />
        </div>
        <CubeSection />
        <div className="h-[200vw] overflow-hidden relative  w-full ">
          <ArtistBio />
        </div>
      </div>
    </div>
  );
}
