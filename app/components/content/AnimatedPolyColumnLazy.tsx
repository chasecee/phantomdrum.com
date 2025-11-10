"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, ComponentType } from "react";
import type { AnimatedPolyColumnProps } from "./three/AnimatedPolyColumnScene";

type PrefetchableComponent<P> = ComponentType<P> & {
  preload?: () => void;
};

const PREFETCH_DELAY = 2000;

const LazyAnimatedPolyColumn = dynamic(
  () => import("./AnimatedPolyColumn"),
  {
    ssr: false,
    loading: () => <div className="w-full h-full" aria-hidden />,
  }
) as PrefetchableComponent<AnimatedPolyColumnProps>;

export default function AnimatedPolyColumnLazy(
  props: AnimatedPolyColumnProps
) {
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

    const prefetch = () => {
      LazyAnimatedPolyColumn.preload?.();
      import("./three/AnimatedPolyColumnScene").catch(() => {});
      setHasPrefetched(true);
    };

    const onScroll = () => {
      if (window.scrollY > 100) {
        prefetch();
        window.removeEventListener("scroll", onScroll);
      }
    };

    const timeoutId = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback?.(prefetch);
      } else {
        prefetch();
      }
    }, PREFETCH_DELAY);

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timeoutId);
    };
  }, [hasPrefetched]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {isVisible ? (
        <LazyAnimatedPolyColumn {...props} />
      ) : (
        <div className={props.className ?? ""} />
      )}
    </div>
  );
}


