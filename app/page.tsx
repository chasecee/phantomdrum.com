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
import ListenButton from "./components/content/ListenButton";
import RippleTextContent from "./components/content/RippleTextContent";

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
      <div className="w-full flex flex-col items-start justify-center my-[20vw] px-6 gap-4">
        <p className="text-[5vw] font-mono font-bold uppercase">Listen Now:</p>
        <div className="grid grid-cols-2 gap-6 w-full ">
          <ListenButton
            text=" spotify"
            href="https://open.spotify.com"
            color="#1DB954"
          />
          <ListenButton
            text="apple music"
            href="https://music.apple.com"
            color="#FA243C"
          />
        </div>
      </div>
      <div className="w-full  ">
        <div className="text-left font-bold p-2 max-w-[1500px] mx-auto text-white ">
          <div className="grid grid-cols-1 gap-[10vw] my-20 px-6">
            <Quote
              text="It could be music!"
              logo={<NatGeoLogo className="w-full h-auto" />}
              className="opacity-90"
            />
            <Quote
              text="...couldn't hang with the pro-robot stance"
              logo={<SiliconValleyLogo className="w-full h-auto" />}
              className="opacity-70"
            />
            <Quote
              text="Bold, daring, full of life"
              logo={<RoyalAcademyLogo className="w-full h-auto" />}
              className="opacity-60"
            />
            <Quote
              text="Avant garde in the lightest sense of the word"
              logo={<RoyalAcademyLogo className="w-full h-auto" />}
              className="opacity-60"
            />
          </div>
        </div>
        <div>
          <RippleTextContent />
        </div>
        <div className="h-screen w-full bg-black"></div>
      </div>
    </div>
  );
}
