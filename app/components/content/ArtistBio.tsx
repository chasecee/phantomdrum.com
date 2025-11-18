import Link from "next/link";

export default function ArtistBio() {
  return (
    <div className="text-[clamp(1.25rem,3vw,2rem)] my-[10vw] space-y-12 px-6 max-w-[800px] mx-auto">
      <p>
        <strong>Phantom Drum</strong> is built on moody synth layers, chopped
        vocals, organic funk patterns and dusty records.
      </p>
      <p>
        INITIALIZE seeks to answer the question:{" "}
        <strong>How many layers should can a beat have?</strong>
      </p>
      <p>
        Ten songs, meticulously composed, embark on a daring search for the line
        between chaos and comfort.
      </p>
    </div>
  );
}
