import HeroLogoText from "../components/sections/HeroLogoText";
import { HalftoneScrollSection } from "./HalftoneScrollSection";

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
      <div className="relative max-w-[1500px] mx-auto">
        <div className="bg-linear-to-b from-slate-900/50 to-amber-800/20">
          <div className="px-6 sticky top-0 z-1 mix-blend-color-dodge">
            <HeroLogoText />
          </div>
          <HalftoneScrollSection />
        </div>
      </div>
      <div className="h-[200vw] w-full border-2 border-emerald-500" />
    </div>
  );
}
