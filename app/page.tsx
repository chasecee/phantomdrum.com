import Container from "./components/Container";
import SVGGroup from "./components/SVGGroup";

export default function Home() {
  return (
    <div>
      <Container>
        <div className="sticky top-0 w-full border-b-8 border-b-emerald-500">
          <SVGGroup />
        </div>
      </Container>
      <div className="px-20 border-8 border-amber-500">
        <h1 className="text-4xl font-bold">Phantom Drum</h1>
      </div>
    </div>
  );
}
