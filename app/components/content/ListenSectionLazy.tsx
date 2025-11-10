"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const LazyListenSection = dynamic(() => import("./ListenSection"), {
  ssr: false,
  loading: () => (
    <div className="w-full my-[10vw] px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mix-blend-difference">
        <div className="aspect-2/1 bg-black" />
        <div className="aspect-2/1 bg-black" />
      </div>
    </div>
  ),
});

export default function ListenSectionLazy() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries, instance) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            instance.disconnect();
          }
        });
      },
      { rootMargin: "-15% 0px", threshold: 0.25 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {isVisible ? (
        <LazyListenSection />
      ) : (
        <div className="w-full my-[10vw] px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mix-blend-difference">
            <div className="aspect-2/1 bg-black" />
            <div className="aspect-2/1 bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}
