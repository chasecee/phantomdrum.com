import Container from "./components/layout/Container";
import SVGGroup from "./components/animations/SVGGroup";
import ContentSection from "./components/content/ContentSection";
import AlbumArt from "./components/content/AlbumArt";
import DevBreakpoint from "./components/DevBreakpoint";

export default function Home() {
  return (
    <div>
      <DevBreakpoint />
      <Container>
        <div className="sticky top-10 w-full md:grid xl:grid-cols-2 gap-10">
          <SVGGroup />
          <AlbumArt />
        </div>
      </Container>
      <ContentSection />
    </div>
  );
}
