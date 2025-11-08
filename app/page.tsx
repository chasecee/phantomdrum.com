import ClientSections from "./components/ClientSections";
import QuotesSection from "./components/content/QuotesSection";
import ListenSection from "./components/content/ListenSection";
import ArtistBio from "./components/content/ArtistBio";

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
      <ClientSections />
      <QuotesSection />
      <ListenSection />
      <ArtistBio />
      <div className="h-[100vw] w-full" />
    </div>
  );
}
