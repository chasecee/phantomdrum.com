import HeroSectionText from "./components/sections/HeroSectionText";
import CubeSection from "./components/sections/CubeSection";
import QuotesSection from "./components/content/QuotesSection";
import ArtistBio from "./components/content/ArtistBio";
import ListenSection from "./components/content/ListenSection";
import { CanvasScrollSection } from "./canvas/CanvasScrollSection";
import { PerfHud } from "./components/dev/PerfHud";

export default function Home() {
  return (
    <>
      <div className="w-full max-w-[1500px] mx-auto body-container">
        <HeroSectionText />
        <div className="mix-blend-difference">
          <CubeSection />
        </div>
        <QuotesSection />
        <ListenSection />
        <ArtistBio />
        <CanvasScrollSection />
        {/* <HalftoneEffect dotRadius={2} dotSpacing={4}>
          <section
            ref={polyColumnSectionRef}
            className="aspect-square w-full relative flex items-center justify-center mix-blend-difference -translate-y-full"
          >
            <AnimatedPolyColumnScene
              texts={POLY_COLUMN_TEXTS}
              trigger={polyColumnSectionRef as RefObject<HTMLElement>}
              start="top bottom"
              end="bottom top"
              scrub={1}
              from={{ rotation: { x: 0, y: 0, z: 0 }, scale: 1 }}
              to={{
                rotation: { x: 0, y: Math.PI * 2.9, z: 0 },
                scale: 0.25,
              }}
              radius={4}
              height={2}
              textSize={0.25}
              strokeWidth={5}
              cameraPosition={[0, 0, 20]}
              cameraFov={25}
              className="w-full h-full"
            />
          </section>
        </HalftoneEffect> */}
        <div className="h-[400vw] w-full" />
      </div>
      {process.env.NODE_ENV === "development" && <PerfHud />}
    </>
  );
}
