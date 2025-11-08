import Link from "next/link";

export default function ArtistBio() {
  return (
    <div className="text-[clamp(1.25rem,3vw,2rem)] my-32 space-y-8 px-8 max-w-[1000px] mx-auto">
      <p>
        <strong>Phantom Drum</strong> is the work of{" "}
        <Link
          href="https://chasecee.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chase&nbsp;Cee
        </Link>
        , a producer and technologist playfully blending retro texture with
        modern precision.
      </p>
      <p>
        Based in Salt Lake City, Utah, he collaborates with humans and robots
        alike.
      </p>
    </div>
  );
}
