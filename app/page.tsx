"use client";

import { RefObject, useRef } from "react";
import SVGGroup from "./art/SVGGroup";
import BackgroundSection from "./art/BackgroundSection";
import ScrubAnimation from "./components/animations/ScrubAnimation";
import NatGeoLogo from "./art/NatGeoLogo";
import SiliconValleyLogo from "./art/SiliconValleyLogo";
import RoyalAcademyLogo from "./art/RoyalAcademyLogo";
import Quote from "./art/Quote";
import SocialLinks from "./components/content/SocialLinks";
import ScaleText from "./components/content/ScaleText";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="w-full max-w-[1500px] mx-auto body-container "
      style={{
        backgroundImage: "url(/img/noise.png)",
        backgroundSize: "100cqi",
        backgroundPosition: "center",
        containerType: "inline-size",
      }}
    >
      <div ref={containerRef} className="relative aspect-1/2 w-full ">
        <div
          className="sticky top-6 z-10 mix-blend-difference px-6"
          style={{ contain: "layout style", overflow: "visible" }}
        >
          <SVGGroup />
        </div>

        <div className="absolute inset-0 w-full overflow-hidden">
          <ScrubAnimation
            trigger={containerRef as RefObject<HTMLElement>}
            start="top top"
            end="bottom 10%"
            scrub={1}
            from={{ scale: 1.5, yPercent: 100 }}
            to={{ scale: 2.5, yPercent: 40 }}
            className="origin-[50%_50%]"
            showMarkers={false}
            invalidateOnRefresh={false}
          >
            <BackgroundSection position="50%_50%" className="aspect-square" />
          </ScrubAnimation>
        </div>
      </div>
      <div className="min-h-screen w-full mt-[20vw] overflow-hidden mix-blend-hard-light">
        <div className="text-left font-bold p-2 max-w-[1500px] mx-auto text-white ">
          <div className="grid grid-cols-1 gap-[20vw] mb-12 px-6">
            <Quote
              text="IT COULD BE MUSIC!"
              logo={<NatGeoLogo className="w-full h-auto" />}
              className="opacity-90"
            />
            <Quote
              text="WE INVESTED $3M INTO THE PROJECT"
              logo={<SiliconValleyLogo className="w-full h-auto" />}
              className="opacity-70"
            />
            <Quote
              text="BOLD, DARING, AND FULL OF LIFE"
              logo={<RoyalAcademyLogo className="w-full h-auto" />}
              className="opacity-60"
            />
            <Quote
              text="AVANT GARDE IN THE LIGHTEST SENSE OF THE WORD"
              logo={<RoyalAcademyLogo className="w-full h-auto" />}
              className="opacity-60"
            />
          </div>
          <div className="flex flex-col items-start gap-2 w-full uppercase overflow-hidden">
            <ScaleText className="w-full">Pro-Robot</ScaleText>
            <ScaleText className="w-full">Phantom-Fresh</ScaleText>
            <ScaleText className="w-full">Feel-Good</ScaleText>
            <ScaleText className="w-full">Tracks</ScaleText>
            <ScaleText className="w-full">For All Y&apos;all</ScaleText>
          </div>
          <SocialLinks />
        </div>
      </div>
    </div>
  );
}
