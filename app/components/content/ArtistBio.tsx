import Link from "next/link";

export default function ArtistBio() {
  return (
    <div className="text-[clamp(1.25rem,3vw,2rem)] my-[10vw] space-y-8 px-6 max-w-[1200px] mx-auto">
      <p>
        <strong>Phantom Drum</strong> is the work of{" "}
        <Link
          href="https://chasecee.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chase&nbsp;Cee
        </Link>
        , a producer and technologist mixing retro texture with modern
        precision. Previously known as{" "}
        <Link
          href="https://lilcha.se"
          target="_blank"
          rel="noopener noreferrer"
        >
          Lil Cha
        </Link>
        ,
      </p>

      <p>
        These songs are favorites from 2019-2025. This is the first release of{" "}
        Phantom Drum. Let&apos;s begin.
      </p>
    </div>
  );
}
