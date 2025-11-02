"use client";

import { useState } from "react";
import Container from "./components/layout/Container";
import SVGGroup from "./components/animations/SVGGroup";
import ContentSection from "./components/content/ContentSection";

export default function Home() {
  const [scrollHeight, setScrollHeight] = useState<number>();

  return (
    <div>
      <Container scrollHeight={scrollHeight}>
        <div className="sticky top-0 w-full">
          <SVGGroup onScrollHeightCalculated={setScrollHeight} />
        </div>
      </Container>
      <ContentSection />
    </div>
  );
}
