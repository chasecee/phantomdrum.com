"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const HalftoneButton = dynamic(
  () => import(/* webpackChunkName: "three-components" */ "./HalftoneButton"),
  {
    ssr: false,
  }
);

export default function ListenSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
            setHasLoaded(true);
          }
        });
      },
      {
        rootMargin: "500px", // Start loading 500px before the section comes into view
        threshold: 0.1,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasLoaded]);

  return (
    <div
      ref={sectionRef}
      className="w-full flex flex-col items-start justify-center my-[10vw] px-6 gap-4"
    >
      <p className="text-[5vw] font-mono font-bold uppercase">Listen Now:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mix-blend-difference">
        {isVisible ? (
          <>
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
          </>
        ) : (
          <>
            <div className="aspect-2/1 bg-black" />
            <div className="aspect-2/1 bg-black" />
          </>
        )}
      </div>
    </div>
  );
}
