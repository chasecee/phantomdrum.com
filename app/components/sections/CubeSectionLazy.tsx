"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const LazyCubeSection = dynamic(() => import("./CubeSection"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[1.5/1] my-[10vw] w-full" aria-hidden />
  ),
}) as ReturnType<typeof dynamic> & { preload?: () => void };

const PREFETCH_DELAY = 2000;

export default function CubeSectionLazy() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasPrefetched, setHasPrefetched] = useState(false);

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
      { rootMargin: "200px 0px", threshold: 0.1 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (hasPrefetched) return;

    const prefetchModule = () => {
      LazyCubeSection.preload?.();
      setHasPrefetched(true);
    };

    const onScroll = () => {
      if (window.scrollY > 100) {
        prefetchModule();
        window.removeEventListener("scroll", onScroll);
      }
    };

    const timeoutId = window.setTimeout(() => {
      const trigger = () => prefetchModule();
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback?.(trigger);
      } else {
        trigger();
      }
    }, PREFETCH_DELAY);

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timeoutId);
    };
  }, [hasPrefetched]);

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
