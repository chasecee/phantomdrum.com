import type { CSSProperties } from "react";
import { Suspense } from "react";
import CubeSection from "./components/sections/CubeSection";
import HeroHalftoneSection from "./components/sections/HeroHalftoneSection";
import ArtistBio from "./components/content/ArtistBio";
import QuotesSection from "./components/content/QuotesSection";
import LatestReviews from "./components/content/LatestReviews";
import SentenceCubeSection from "./components/sections/SentenceCubeSection";
import HeroLogoTextTwoColor from "./components/sections/HeroLogoTextBottom";
import HeroMeteors from "./components/sections/HeroMeteors";
import HeroLogoTextTwoColorReversed from "./components/sections/HeroLogoTextTop";
import ListenSection from "./components/content/ListenSection";
import ReleaseCountdownCard from "./components/scheduling/ReleaseCountdownCard";

export default function Page() {
  const releaseArtwork = {
    src: "/img/optimized/album-art.webp",
    alt: "Phantom Drum Initialize cover art",
  };

  return (
    <div className="w-full">
      <div className="relative max-w-[1200px] mx-auto lg:bg-transparentbg-linear-to-b from-slate-950/60 via-amber-900/20 to-transparent">
        <div
          style={
            {
              containerType: "inline-size",
            } as CSSProperties
          }
        >
          <HeroMeteors />
          <HeroLogoTextTwoColorReversed />

          <HeroHalftoneSection />
          <HeroLogoTextTwoColor />
        </div>
        <CubeSection />
        <div className="space-y-10">
          <ReleaseCountdownCard
            label="LIVE ON ALL PLATFORMS"
            metaLabel="Album"
            title="INITIALIZE"
            cover={releaseArtwork}
          />
          <ListenSection />
        </div>

        <QuotesSection />

        <Suspense fallback={null}>
          <SentenceCubeSection />
        </Suspense>
        <LatestReviews />
        <ArtistBio />
        <ListenSection />
      </div>
    </div>
  );
}
