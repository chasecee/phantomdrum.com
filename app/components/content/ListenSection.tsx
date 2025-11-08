"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const HalftoneButton = dynamic(
  () => import(/* webpackChunkName: "halftone-button" */ "./HalftoneButton"),
  {
    ssr: false,
  }
);

export default function ListenSection() {
  return (
    <div className="w-full flex flex-col items-start justify-center my-[10vw] px-6 gap-4">
      <p className="text-[5vw] font-mono font-bold uppercase">Listen Now:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mix-blend-difference">
        <Suspense fallback={<div className="aspect-2/1" />}>
          <HalftoneButton
            text="Spotify"
            href="https://open.spotify.com"
            color="#1DB954"
          />
        </Suspense>
        <Suspense fallback={<div className="aspect-2/1" />}>
          <HalftoneButton
            text="Apple Music"
            href="https://music.apple.com"
            color="#D51F35"
          />
        </Suspense>
      </div>
    </div>
  );
}
