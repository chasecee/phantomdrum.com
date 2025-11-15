"use client";

import Link from "next/link";
import HalftoneEffect from "./HalftoneEffect";

export default function ListenSection() {
  return (
    <div className="w-full flex flex-col items-start justify-center my-[10vw] px-6 gap-4">
      <p className="text-[5vw] font-mono font-bold uppercase">Listen Now:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mix-blend-difference-off">
        <HalftoneEffect>
          <Link
            href="https://open.spotify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="button"
            style={{ color: "#1DB954" }}
          >
            <div className="button-background"></div>
            <span className="button-text">Spotify</span>
          </Link>
        </HalftoneEffect>
        <HalftoneEffect>
          <Link
            href="https://music.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="button"
            style={{ color: "#D51F35" }}
          >
            <div className="button-background"></div>
            <span className="button-text">Apple Music</span>
          </Link>
        </HalftoneEffect>
      </div>
    </div>
  );
}
