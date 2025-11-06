import Link from "next/link";
import ScaleText from "./ScaleText";

export default function RippleTextContent() {
  return (
    <>
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
              href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23000000'/%3E%3Cstop offset='25%25' stop-color='%23808080'/%3E%3Cstop offset='50%25' stop-color='%23ffffff'/%3E%3Cstop offset='75%25' stop-color='%23808080'/%3E%3Cstop offset='100%25' stop-color='%23000000'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' fill='%23808080'/%3E%3Cpath d='M 0 100 Q 50 50 100 100 T 200 100' stroke='url(%23g)' stroke-width='100' fill='none'/%3E%3C/svg%3E"
              result="waveSource"
            />
            <feGaussianBlur in="waveSource" stdDeviation="4" result="blurred" />
            <feComponentTransfer in="blurred" result="verticalWave">
              <feFuncR type="discrete" tableValues="0.5" />
              <feFuncG type="identity" />
            </feComponentTransfer>
            <feDisplacementMap
              in="SourceGraphic"
              in2="verticalWave"
              scale="50"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <div className="relative w-[clamp(200px,80%,800px)] mx-auto py-10">
        <div className="space-y-16 leading-none relative text-[3vw] bg-fixed bg-linear-to-b font-serif  font-[150] from-transparent via-white to-transparent bg-clip-text text-white/50">
          <p
            className="text-[1.5em] text-balance font-mono uppercase bg-clip-text text-transparent"
            style={{
              filter: "url(#rippleDisplacement)",
              backgroundImage: "url(/img/no-bg-cropped.png)",
              backgroundSize: "100%",
              backgroundPosition: "left top",
              backgroundAttachment: "fixed",
            }}
          >
            <ScaleText>Ghost-grade</ScaleText>
            <ScaleText>farm-fresh</ScaleText>
            <ScaleText>beats</ScaleText>
            <ScaleText>designed to delight</ScaleText>
            <ScaleText>& disturb</ScaleText>
          </p>
          <p className="">
            Phantom Drum is the work of{" "}
            <Link
              href="https://chasecee.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chase Cee
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
    </>
  );
}
