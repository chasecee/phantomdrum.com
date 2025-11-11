"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentType } from "react";

type PrefetchableComponent<P> = ComponentType<P> & {
  preload?: () => void;
};

type WindowWithIdleCallback = Window & {
  requestIdleCallback: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
};

const hasRequestIdleCallback = (win: Window): win is WindowWithIdleCallback =>
  typeof (win as Partial<WindowWithIdleCallback>).requestIdleCallback ===
  "function";

const LazyCubeSection = dynamic<Record<string, never>>(
  () => import("./CubeSection"),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[1.5/1] my-[10vw] w-full" aria-hidden />
    ),
  }
) as PrefetchableComponent<Record<string, never>>;

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
      { rootMargin: "50% 0px", threshold: 0 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (hasPrefetched) return;

    const prefetchModule = () => {
      LazyCubeSection.preload?.();
      import("../content/three/AnimatedMultiCubeScene").catch(() => {});
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
      if (hasRequestIdleCallback(window)) {
        window.requestIdleCallback(trigger);
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
        <div className="aspect-[1.5/1] my-[20vw] w-full" />
      )}
    </div>
  );
}
