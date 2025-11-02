import Container from "./components/layout/Container";
import SVGGroup from "./components/animations/SVGGroup";
import StickyScroll from "./components/animations/StickyScroll";
import ContentSection from "./components/content/ContentSection";
import AlbumArt from "./components/content/AlbumArt";
import DevBreakpoint from "./components/DevBreakpoint";

export default function Home() {
  return (
    <div>
      <DevBreakpoint />
      <Container>
        <StickyScroll>
          <div className="md:grid xl:grid-cols-2 gap-10">
            <SVGGroup />
            <AlbumArt />
          </div>
        </StickyScroll>
      </Container>
      <ContentSection />
    </div>
  );
}
