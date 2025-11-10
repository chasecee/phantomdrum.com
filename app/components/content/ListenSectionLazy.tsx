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

const listenSectionWithPreload = LazyListenSection as { preload?: () => void };

export default function ListenSectionLazy() {
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
      { rootMargin: "400px" }
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
        listenSectionWithPreload.preload?.();
      });
    } else {
      timeoutHandle = window.setTimeout(() => {
        listenSectionWithPreload.preload?.();
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
