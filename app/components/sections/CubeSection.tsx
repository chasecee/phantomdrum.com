"use client";

import { RefObject, useRef, useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";

const AnimatedMultiCube = dynamic(
  () =>
    import(
      /* webpackChunkName: "animated-multicube" */ "../content/AnimatedMultiCube"
    ),
  { ssr: false }
);

const PREFETCH_DELAY = 2000;

export default function CubeSection() {
  const multiCubeContainerRef = useRef<HTMLDivElement>(null);
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
        rootMargin: "500px", // Start loading 500px before the element comes into view
        threshold: 0.1,
      }
    );

    if (multiCubeContainerRef.current) {
      observer.observe(multiCubeContainerRef.current);
    }

    return () => observer.disconnect();
  }, [hasLoaded]);

  useEffect(() => {
    if (hasLoaded) return;

    const timeoutId = window.setTimeout(() => {
      const trigger = () => {
        AnimatedMultiCube.preload?.();
        import("../content/three/AnimatedMultiCubeScene").catch(() => {});
      };
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback?.(trigger);
      } else {
        trigger();
      }
    }, PREFETCH_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, [hasLoaded]);

  return (
    <div
      ref={multiCubeContainerRef}
      className="aspect-[1.5/1] my-[10vw] w-full relative mix-blend-screen"
    >
      {isVisible ? (
        <Suspense fallback={<div className="absolute inset-0" />}>
          <AnimatedMultiCube
            texts={[
              "GHOST GRADE",
              "FARM-FRESH",
              "ABSTRACT YET FAMILIAR",
              "CLASSIC SUNDAY DINNER",
              "BIG OL BEATS",
            ]}
            trigger={multiCubeContainerRef as RefObject<HTMLElement>}
            start="40% 80%"
            end="60% 20%"
            from={{ rotation: { x: 0.01, y: 0, z: 0 } }}
            to={{
              rotation: { x: -0.01, y: -Math.PI * 0.5, z: 0 },
            }}
            className="absolute inset-0"
            heightRatio={0.175}
            widthRatio={1.1}
            size={3}
            spacing={0.1}
            stagger={true}
            staggerDelay={0.1}
            fillMode="outline"
            strokeWidth={10}
            matchTextColor={true}
          />
        </Suspense>
      ) : (
        <div className="absolute inset-0 bg-black" />
      )}
    </div>
  );
}

