"use client";

import dynamic from "next/dynamic";
import { Suspense, type ComponentType } from "react";

interface HalftoneButtonProps {
  text: string;
  href: string;
  color: string;
}

// Dynamically import the Three.js scene to prevent upfront bundling
type PrefetchableComponent<P> = ComponentType<P> & {
  preload?: () => Promise<unknown>;
};

const HalftoneButtonScene = dynamic(
  () =>
    import("./ThreeScenes").then((mod) => ({
      default: mod.HalftoneButtonScene,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60px]">
        <div className="text-white opacity-50" />
      </div>
    ),
  }
) as PrefetchableComponent<HalftoneButtonProps>;

const PREFETCH_DELAY = 2000;

const scheduleIdle = (callback: () => void) => {
  if (typeof window === "undefined") return;
  const idle = (
    window as Window & {
      requestIdleCallback?: (
        cb: IdleRequestCallback,
        options?: IdleRequestOptions
      ) => number;
    }
  ).requestIdleCallback;
  if (typeof idle === "function") {
    idle(() => callback());
  } else {
    callback();
  }
};

if (typeof window !== "undefined") {
  window.setTimeout(() => {
    scheduleIdle(() => HalftoneButtonScene.preload?.());
  }, PREFETCH_DELAY);
}

export default function HalftoneButton({
  text,
  href,
  color,
}: HalftoneButtonProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60px]">
          <div className="text-white opacity-50">
            {/* Loading placeholder */}
          </div>
        </div>
      }
    >
      <HalftoneButtonScene text={text} href={href} color={color} />
    </Suspense>
  );
}
