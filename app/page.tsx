import Container from "./components/layout/Container";
import SVGGroup from "./components/animations/SVGGroup";
import ContentSection from "./components/content/ContentSection";

export default function Home() {
  return (
    <div>
      <Container>
        <div className="sticky top-0 w-full">
          <SVGGroup />
        </div>
      </Container>
      <ContentSection />
    </div>
  );
}
