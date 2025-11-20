export default function ArtistBio() {
  return (
    <section
      className="relative mx-auto w-full  px-20 pr-10"
      style={{
        backgroundImage: "url('/img/scroll.svg')",
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundBlendMode: "difference",
        containerType: "inline-size",
      }}
    >
      <div className="relative text-[clamp(1.2rem,2cqi,2.3rem)] max-w-[30ch] p-[5cqi] mx-auto [&>p]:leading-[1.45] [&>p]:text-pretty font-serif space-y-12">
        <p>
          <strong>Phantom Drum</strong> is built on moody synth layers, chopped
          vocals, organic funk patterns and dusty records.
        </p>
        <p>
          Ten songs, meticulously composed, embark on a search for the line
          between chaos and comfort.
        </p>
        <p>
          How many layers can a dang beat have? INITIALIZE seeks to answer this
          question through samples, synthesizers and drum machines.
        </p>
        <p>
          Curiosity drives the production style from Gorillaz to Enya to Aphex
          Twin.
        </p>
      </div>
    </section>
  );
}
