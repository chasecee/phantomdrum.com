import dynamic from "next/dynamic";
import HeroSection from "./components/sections/HeroSection";
import QuotesSection from "./components/content/QuotesSection";
import ArtistBio from "./components/content/ArtistBio";
import ListenSection from "./components/content/ListenSection";

const CubeSection = dynamic(() => import("./components/sections/CubeSection"), {
  ssr: false,
});

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
