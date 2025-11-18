import Link from "next/link";

export default function ArtistBio() {
  return (
    <div className="text-[clamp(1.25rem,3vw,2rem)] my-[10vw] space-y-8 px-6 max-w-[800px] mx-auto">
      <p>
        <strong>Phantom Drum</strong> is the work of{" "}
        <Link
          href="https://chasecee.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chase&nbsp;Cee
        </Link>
        , a producer specializing in sample-heavy hip-hop/electronic beats.
      </p>

      <p>
        These songs are favorites from 2019-2025. Mostly sample-heavy
        hip-hop/electronic beats.
      </p>
    </div>
  );
}
