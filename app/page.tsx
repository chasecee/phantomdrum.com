import SVGGroup from "./components/animations/SVGGroup";
import ContentSection from "./components/content/ContentSection";
import AlbumArt from "./components/content/AlbumArt";
import DevBreakpoint from "./components/DevBreakpoint";

export default function Home() {
  return (
    <div>
      <DevBreakpoint />
      <div className="flex flex-col items-start  max-w-[1500px]">
        <div className="sticky w-full  top-0 md:grid  gap-10 z-10 mix-blend-difference">
          <div className="py-6 mx-6">
            <SVGGroup />
          </div>
        </div>
        {/* <ScrubAnimation scrubAmount={-200} scrubSpeed={2}>
          
        </ScrubAnimation> */}
        <div className="w-full top-0 flex flex-col items-end justify-end mx-auto overflow-hidden">
          <div className="w-full h-[90svw]" />
          <AlbumArt />
        </div>
      </div>
      <ContentSection />
    </div>
  );
}
