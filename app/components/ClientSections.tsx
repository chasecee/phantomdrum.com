"use client";

import dynamic from "next/dynamic";

const HeroSection = dynamic(() => import("./sections/HeroSection"), {
  ssr: false,
});

const CubeSection = dynamic(() => import("./sections/CubeSection"), {
  ssr: false,
});

export default function ClientSections() {
  return (
    <>
      <HeroSection />
      <CubeSection />
    </>
  );
}
