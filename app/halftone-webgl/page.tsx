import HeroLogoText from "../components/sections/HeroLogoText";
import { HalftoneScrollSection } from "./HalftoneScrollSection";
import ArtistBio from "../components/content/ArtistBio";
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
          <div className="p-6 sticky top-0  z-1 mix-blend-plus-lighter">
            <HeroLogoText />
          </div>
          <HalftoneScrollSection />
        </div>

        <div className="h-[200vw] overflow-hidden relative  w-full ">
          <ArtistBio />
        </div>
      </div>
    </div>
  );
}
