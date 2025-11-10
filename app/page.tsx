import HeroSection from "./components/sections/HeroSection";
import CubeSection from "./components/sections/CubeSectionLazy";
import QuotesSection from "./components/content/QuotesSection";
import ArtistBio from "./components/content/ArtistBio";
import ListenSection from "./components/content/ListenSectionLazy";
import CubeLabelPreview from "./components/content/CubeLabelPreview";

export default function Home() {
  return (
    <div
      className="w-full max-w-[1500px] mx-auto body-container"
      style={{
        backgroundImage: "url(/img/optimized/noise.webp)",
        backgroundSize: "min(100%, 1128px)",
        backgroundPosition: "center",
        containerType: "inline-size",
      }}
    >
      <HeroSection />
      <CubeSection />
      <QuotesSection />
      <ListenSection />
      <ArtistBio />
      <div className="h-[100vw] w-full" />
    </div>
  );
}
