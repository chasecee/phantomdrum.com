import Link from "next/link";
import ScaleText from "./ScaleText";
import ScrubAnimation from "../animations/ScrubAnimation";
import { RefObject, useRef } from "react";

export default function RippleTextContent() {
  const testerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="relative overflow-hidden">
      <svg className="pointer-events-none" style={{ width: 0, height: 0 }}>
        <defs>
          <filter
            id="rippleDisplacement"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            filterUnits="objectBoundingBox"
            primitiveUnits="userSpaceOnUse"
          >
            <feImage
              href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='900'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='50%25' r='50%25' fx='50%25' fy='50%25'%3E%3Cstop offset='0%25' stop-color='%23000000'/%3E%3Cstop offset='25%25' stop-color='%23808080'/%3E%3Cstop offset='40%25' stop-color='%23ffffff'/%3E%3Cstop offset='75%25' stop-color='%23808080'/%3E%3Cstop offset='100%25' stop-color='%23000000'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='900' height='900' fill='%23808080'/%3E%3Cpath d='M 0 450 Q 225 225 450 450 T 900 450' stroke='url(%23g)' stroke-width='450' fill='none'/%3E%3C/svg%3E"
              result="waveSource"
            />
            <feComponentTransfer in="blurred" result="verticalWave">
              <feFuncR type="discrete" tableValues=".5" />
              <feFuncG type="identity" />
            </feComponentTransfer>
            <feDisplacementMap
              in="SourceGraphic"
              in2="verticalWave"
              scale="10"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <div className="relative px-[10vw] mx-auto ">
        <div
          ref={testerRef}
          className="space-y-16 leading-none relative text-[4vw] font-[150] text-white/50 mix-blend-difference"
        >
          <div className="mt-[10vw] mb-[8vw] origin-[50%_50%] skew-x-[-3deg] skew-y-[-3deg]">
            <div className="tester text-balance font-mono font-bold  uppercase bg-clip-text text-white">
              <ScrubAnimation
                trigger={testerRef as RefObject<HTMLElement>}
                start="50% bottom"
                end="50% 30%"
                scrub={2}
                from={{ xPercent: -2 }}
                to={{ xPercent: 5 }}
                className="origin-[50%_50%]"
                showMarkers={true}
              >
                <ScaleText>Ghost-grade farm-fresh</ScaleText>
              </ScrubAnimation>
              <ScrubAnimation
                trigger={testerRef as RefObject<HTMLElement>}
                start="50% bottom"
                end="50% 30%"
                scrub={3}
                from={{ xPercent: 5 }}
                to={{ xPercent: -5 }}
                className="origin-[50%_50%]"
                showMarkers={true}
              >
                <ScaleText>ABSTRACT YET, FAMILIAR</ScaleText>
              </ScrubAnimation>
              <div className="w-[220vw] mx-auto">
                <ScrubAnimation
                  trigger={testerRef as RefObject<HTMLElement>}
                  start="50% bottom"
                  end="50% 30%"
                  scrub={2}
                  from={{ xPercent: 40 }}
                  to={{ xPercent: -66 }}
                  className="origin-[50%_50%]"
                  showMarkers={true}
                >
                  <ScaleText className=" text-white [text-shadow:5px_3px_0px_var(--color-amber-600),10px_6px_0px_var(--color-amber-700)]">
                    ENYA POWERED ORCHESTRAL MEGA BEATS
                  </ScaleText>
                </ScrubAnimation>
              </div>
            </div>
          </div>
        </div>
        <div className="text-[2.5vw] space-y-8">
          <p className="">
            Phantom Drum is the work of{" "}
            <Link
              href="https://chasecee.com"
              target="_blank"
              rel="noopener noreferrer "
            >
              Chase&nbsp;Cee
            </Link>
            , a producer and technologist playfully blending retro texture with
            modern precision.
          </p>
          <p>
            Based in Salt Lake City, Utah, and collaborating with artists across
            the country and around the world.
          </p>
        </div>
      </div>
    </div>
  );
}
