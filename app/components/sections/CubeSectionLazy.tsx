"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const LazyCubeSection = dynamic(() => import("./CubeSection"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[1.5/1] my-[10vw] w-full" aria-hidden />
  ),
});

export default function CubeSectionLazy() {
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
        <LazyCubeSection />
      ) : (
        <div className="aspect-[1.5/1] my-[10vw] w-full" />
      )}
    </div>
  );
}
