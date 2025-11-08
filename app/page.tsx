import ClientSections from "./components/ClientSections";
import QuotesSection from "./components/content/QuotesSection";
import ArtistBio from "./components/content/ArtistBio";
import ProgressiveClientComponent from "./components/ProgressiveClientComponent";
import ListenSection from "./components/content/ListenSection";

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
      <ProgressiveClientComponent
        fallback={
          <div className="w-full flex flex-col items-start justify-center my-[10vw] px-6 gap-4">
            <p className="text-[5vw] font-mono font-bold uppercase">
              Listen Now:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mix-blend-difference">
              <div className="aspect-2/1" />
              <div className="aspect-2/1" />
            </div>
          </div>
        }
      >
        <ListenSection />
      </ProgressiveClientComponent>
      <ArtistBio />
      <div className="h-[100vw] w-full" />
    </div>
  );
}
