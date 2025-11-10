"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const LazyCubeSection = dynamic(() => import("./CubeSection"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[1.5/1] my-[10vw] w-full" aria-hidden />
  ),
});

const cubeSectionWithPreload = LazyCubeSection as { preload?: () => void };

export default function CubeSectionLazy() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible || !containerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries, instance) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            instance.disconnect();
          }
        });
      },
      { rootMargin: "800px" }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      return;
    }

    const win = window as typeof window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;

    if (typeof win.requestIdleCallback === "function") {
      idleHandle = win.requestIdleCallback(() => {
        cubeSectionWithPreload.preload?.();
      });
    } else {
      timeoutHandle = window.setTimeout(() => {
        cubeSectionWithPreload.preload?.();
      }, 2000);
    }

    return () => {
      if (
        typeof win.cancelIdleCallback === "function" &&
        typeof idleHandle === "number"
      ) {
        win.cancelIdleCallback(idleHandle);
      }
      if (typeof timeoutHandle === "number") {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, [isVisible]);

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
