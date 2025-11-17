import HeroLogoText from "../components/sections/HeroLogoText";
import { HalftoneScrollSection } from "./HalftoneScrollSection";
import type { HalftoneParamsPreset } from "./halftoneTypes";
import ArtistBio from "../components/content/ArtistBio";
import CubeSection from "../components/sections/CubeSection";
import HalftoneEffect from "../components/content/HalftoneEffect";
export default function HalftoneWebGLDemoPage() {
  const layers = [
    {
      imageSrc: "/img/optimized/linesbg.webp",
      imageFit: "cover" as const,
      placement: "background" as const,
      className:
        " absolute [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_20%,transparent_44%)] [mask-size:100%_100%] [mask-repeat:no-repeat] [mask-position:50%_50%]",
      params: {
        initial: {
          halftoneSize: "5%",
          dotSpacing: ".4%",
          rgbOffset: "6%",
          rgbOffsetAngle: 0,
          effectIntensity: 0.01,
          patternRotation: 55,
          zoom: 4,
          translateY: "0%",
        } satisfies HalftoneParamsPreset,
        target: {
          halftoneSize: "10%",
          dotSpacing: "1%",
          rgbOffset: "0%",
          rgbOffsetAngle: 10,
          effectIntensity: 0.001,
          patternRotation: 55,
          zoom: 0.8,
          translateY: "0%",
        } satisfies HalftoneParamsPreset,
      },
    },
    {
      imageSrc: "/img/optimized/planet-cropped.webp",
      imageFit: "contain" as const,
      placement: "foreground" as const,
      className: "mix-blend-normal ",
      params: {
        initial: {
          halftoneSize: "5%",
          dotSpacing: ".2%",
          rgbOffset: "10%",
          rgbOffsetAngle: 90,
          effectIntensity: 0.1,
          patternRotation: 55,
          zoom: 1.5,
          translateY: "0%",
        } satisfies HalftoneParamsPreset,
        target: {
          halftoneSize: "5%",
          dotSpacing: "0.1%",
          rgbOffset: "-1%",
          rgbOffsetAngle: 90,
          effectIntensity: 0.4,
          patternRotation: 55,
          zoom: 0.9,
          translateY: "20%",
        } satisfies HalftoneParamsPreset,
      },
    },
  ];

  return (
    <div className="w-full">
      <div className="relative max-w-[1500px] mx-auto bg-linear-to-b from-slate-900/30 to-amber-800/20 ">
        <div
          className=""
          style={{
            maskImage: "linear-gradient(to top, transparent, black 15%)",
            maskSize: "100% 100%",
            maskPosition: "bottom",
            maskRepeat: "no-repeat",
          }}
        >
          <div className="px-6 sticky top-6  z-1 mix-blend-plus-lighter">
            <HalftoneEffect dotRadius={2} dotSpacing={4}>
              <HeroLogoText />
            </HalftoneEffect>
          </div>
          <HalftoneScrollSection
            config={{
              baseLayerIndex: 1,
              layers,
            }}
          />
        </div>
        <CubeSection />
        <div className="h-[200vw] overflow-hidden relative  w-full ">
          <ArtistBio />
        </div>
      </div>
    </div>
  );
}
