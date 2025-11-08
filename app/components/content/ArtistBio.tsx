import Link from "next/link";
import SocialLinks from "./SocialLinks";
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
        , a producer and technologist mixing retro texture with modern
        precision.
      </p>

      <p>
        These songs are favorites from 2019-2025. This is the first release of{" "}
        Phantom Drum. Initialization is what happens when a system boots for the
        first time. Let's begin.
      </p>
    </div>
  );
}
