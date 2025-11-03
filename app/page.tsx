import SVGGroup from "./components/animations/SVGGroup";
import ContentSection from "./components/content/ContentSection";
import AlbumArt from "./components/content/AlbumArt";
import DevBreakpoint from "./components/DevBreakpoint";

export default function Home() {
  return (
    <div>
      <DevBreakpoint />
      <div className="flex flex-col items-start px-10">
        <div className="sticky  w-full max-w-[1500px] top-0 md:grid  gap-10 z-10 mix-blend-difference">
          <SVGGroup />
        </div>
        {/* <ScrubAnimation scrubAmount={-200} scrubSpeed={2}>
          
        </ScrubAnimation> */}
        <div className="w-full top-0 flex flex-col items-end justify-end mx-auto overflow-hidden">
          <div className="w-full h-full aspect-[500/300]" />
          <AlbumArt />
        </div>
      </div>
      <ContentSection />
    </div>
  );
}
