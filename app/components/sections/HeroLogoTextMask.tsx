import type { CSSProperties } from "react";
export default function HeroLogoText() {
  return (
    // <HalftoneEffect
    //   dotRadius={{ base: 2, md: 3 }}
    //   dotSpacing={{ base: 5, md: 10 }}
    //   className="HERO_LOGO_TEXT"
    //   shape="octagon"
    // >
    <div
      className="relative h-[50vw] mb-[-10vw]"
      style={{
        maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
        maskSize: "100% 100%",
        maskPosition: "center bottom",
      }}
    >
      <div
        className="HERO_TITLE  h-[120%] relative top-0 z-10 w-full"
        style={
          {
            containerType: "inline-size",
            maskImage: "url('/warped-halftone/vector/halftone-hero.svg')",
            maskSize: "cover",
            maskPosition: "50% 50%",
            maskRepeat: "repeat",
          } as CSSProperties
        }
      >
        <div className="sticky top-0">
          <h1 className="text-[13.5cqi] scale-y-[3] origin-top leading-[0.8] font-bold text-white">
            PHANTOM DRUM
          </h1>

          {/* <Image
        src={heroLogo}
        alt="Phantom Drum"
        priority
        width={1042}
        height={108}
        sizes="100vw"
        decoding="sync"
        className="relative h-auto aspect-[1042/108] backface-hidden w-full max-h-[calc(80svh-4rem)] skew-y-[0.5deg]"
      /> */}
        </div>
      </div>
    </div>
  );
}
