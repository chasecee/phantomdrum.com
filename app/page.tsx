import type { CSSProperties } from "react";
import CubeSection from "./components/sections/CubeSection";
import HeroHalftoneSection from "./components/sections/HeroHalftoneSection";
import ArtistBio from "./components/content/ArtistBio";
import QuotesSection from "./components/content/QuotesSection";
import SentenceCubeSection from "./components/sections/SentenceCubeSection";
import HeroLogoTextTwoColor from "./components/sections/HeroLogoTextTwoColor";
import HeroMeteors from "./components/sections/HeroMeteors";
import HeroLogoTextTwoColorReversed from "./components/sections/HeroLogoTextTwoColorReversed";
import ListenSection from "./components/content/ListenSection";
import PreSaveSection from "./components/content/PreSaveSection";
import ScheduleGate from "./components/scheduling/ScheduleGate";
import ReleaseCountdownCard from "./components/scheduling/ReleaseCountdownCard";
import ScrollArrow from "./components/sections/ScrollArrow";
import { releaseSchedule } from "../config/releaseSchedule";
const HERO_SCALE_MULTIPLIER = 0.18;

export const dynamic = "force-dynamic";

export default function Page() {
  const releaseDateIso = releaseSchedule.releaseDate.toISOString();
  const releaseLabels = {
    before: releaseSchedule.labels.before ?? "Pre-release",
    after: releaseSchedule.labels.after ?? "Post-release",
  };
  const releaseArtwork = {
    src: "/img/optimized/album-art.webp",
    alt: "Phantom Drum Initialize cover art",
  };

  return (
    <div className="w-full">
      <div className="relative max-w-[1500px] mx-auto bg-linear-to-b from-slate-950/60 via-amber-900/20 to-transparent">
        <div
          style={
            {
              maskSize: "100% 100%",
              maskPosition: "bottom",
              maskRepeat: "no-repeat",
              containerType: "inline-size",
              "--aspect-width": "1042",
              "--aspect-height": "600",
              "--scale-multiplier": `${HERO_SCALE_MULTIPLIER}`,
              "--aspect-ratio":
                "calc(var(--aspect-width)/var(--aspect-height))",
            } as CSSProperties
          }
        >
          <HeroMeteors />
          <HeroLogoTextTwoColorReversed />

          <HeroHalftoneSection />
          <HeroLogoTextTwoColor />
        </div>
        <CubeSection />
        <ScrollArrow />
        <ScheduleGate
          releaseDate={releaseSchedule.releaseDate}
          labels={releaseSchedule.labels}
          before={
            <div className="space-y-10">
              <ReleaseCountdownCard
                releaseDateIso={releaseDateIso}
                label={releaseLabels.before}
                metaLabel="Album"
                title="INITIALIZE"
                cover={releaseArtwork}
              />
              <PreSaveSection />
            </div>
          }
          after={
            <div className="space-y-10">
              <ReleaseCountdownCard
                releaseDateIso={releaseDateIso}
                label={releaseLabels.after}
                metaLabel="Album"
                title="INITIALIZE"
                cover={releaseArtwork}
                variant="released"
              />
              <ListenSection />
            </div>
          }
        />

        <QuotesSection />
        <SentenceCubeSection />
        <ArtistBio />
      </div>
    </div>
  );
}
