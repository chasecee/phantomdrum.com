"use client";

import { RefObject, useRef } from "react";
import SVGGroup from "./SVGGroup";
import BackgroundSection from "./BackgroundSection";
import ScrubAnimation from "../components/animations/ScrubAnimation";
import NatGeoLogo from "./NatGeoLogo";
import SiliconValleyLogo from "./SiliconValleyLogo";
import RoyalAcademyLogo from "./RoyalAcademyLogo";
import Quote from "./Quote";
import SocialLinks from "../components/content/SocialLinks";

export default function ArtPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="w-full max-w-[1500px] mx-auto"
      style={{
        backgroundImage: "url(/img/noise.png)",
        backgroundSize: "100vw",
        backgroundPosition: "center",
      }}
    >
      <div ref={containerRef} className="relative aspect-1/2 w-full ">
        <div className="sticky top-0 z-10 mix-blend-difference ">
          <SVGGroup />
        </div>

        <div className="absolute aspect-square w-full bottom-0 ">
          <ScrubAnimation
            trigger={containerRef as RefObject<HTMLElement>}
            start="top top"
            end="bottom 40%"
            scrub={true}
            from={{ scale: 1.5, yPercent: 25 }}
            to={{ scale: 3, yPercent: -50 }}
            className="origin-center"
            showMarkers={true}
          >
            <BackgroundSection position="50%_0%" className="aspect-square" />
          </ScrubAnimation>
        </div>
      </div>
      <div className="h-screen w-full mt-[20vw] mix-blend-hard-light">
        <ScrubAnimation
          trigger={containerRef as RefObject<HTMLElement>}
          start="top top"
          end="bottom top"
          scrub={1}
          from={{ opacity: 0.5 }}
          to={{ opacity: 1 }}
        >
          <div className="text-left font-bold p-2 max-w-[1500px] mx-auto text-white ">
            <div className="grid grid-cols-1 gap-[20vw] mb-12">
              <Quote
                text="IT COULD BE MUSIC!"
                logo={<NatGeoLogo className="w-full h-auto" />}
                className="opacity-90 flex justify-start items-start md:max-w-[500px] text-left flex-col"
              />
              <Quote
                text="WE INVESTED 3M"
                logo={<SiliconValleyLogo className="w-full h-auto" />}
                className="opacity-70 text-right flex justify-center items-center flex-col"
              />
              <Quote
                text="BOLD, DARING, AND FULL OF LIFE"
                logo={<RoyalAcademyLogo className="w-full h-auto" />}
                className="opacity-60 text-right flex justify-end flex-col items-end"
              />
              <Quote
                text="AVANT GARDE IN THE LIGHTEST SENSE OF THE WORD"
                logo={<RoyalAcademyLogo className="w-full h-auto" />}
                className="opacity-60 text-right flex text-center flex-col items-end"
              />
            </div>
            <div className="flex flex-col items-start text-[11vw] leading-tight">
              <p className=" leading-tight text-balance">Pro-Robot</p>
              <p className="">Farm-Fresh</p>
              <p className="">Feel Good</p>
              <p className="">Tracks</p>
              <p className="">For All Y&apos;all</p>
            </div>
            <SocialLinks />
          </div>
        </ScrubAnimation>
      </div>
    </div>
  );
}
