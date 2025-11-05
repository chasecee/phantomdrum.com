"use client";

import { useEffect, useRef, RefObject, ReactNode } from "react";

interface ScrubAnimationConfig {
  trigger: RefObject<HTMLElement>;
  start: string;
  end: string;
  scrub?: number | boolean;
  from?: Record<string, string | number>;
  to: Record<string, string | number>;
  ease?: string;
  pin?: boolean;
  showMarkers?: boolean;
  markerColor?: string;
  toggleActions?: string;
  invalidateOnRefresh?: boolean;
}

interface ScrubAnimationProps {
  children: ReactNode;
  trigger: RefObject<HTMLElement>;
  start: string;
  end: string;
  scrub?: number | boolean;
  from?: Record<string, string | number>;
  to: Record<string, string | number>;
  ease?: string;
  pin?: boolean;
  showMarkers?: boolean;
  markerColor?: string;
  toggleActions?: string;
  invalidateOnRefresh?: boolean;
  className?: string;
}

export function useScrubAnimation(
  elementRef: RefObject<HTMLElement | null>,
  config: ScrubAnimationConfig
): void {
  const fromStr = JSON.stringify(config.from);
  const toStr = JSON.stringify(config.to);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !elementRef?.current ||
      !config.trigger?.current
    )
      return;

    let stTrigger:
      | ReturnType<typeof import("gsap/ScrollTrigger").ScrollTrigger.create>
      | undefined;

    const initAnimation = async (): Promise<void> => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");

      gsap.registerPlugin(ScrollTrigger);

      if (!elementRef.current) return;

      const markerConfig = config.showMarkers
        ? {
            markers: {
              startColor: config.markerColor || "cyan",
              endColor: config.markerColor || "cyan",
              fontSize: "12px",
              fontWeight: "bold",
            },
          }
        : { markers: false };

      const scrollTriggerConfig: Record<string, unknown> = {
        trigger: config.trigger.current,
        start: config.start,
        end: config.end,
        pin: config.pin ?? false,
        invalidateOnRefresh: config.invalidateOnRefresh ?? true,
        ...markerConfig,
      };

      if (config.toggleActions) {
        scrollTriggerConfig.toggleActions = config.toggleActions;
      } else {
        scrollTriggerConfig.scrub = config.scrub ?? 1;
      }

      const animationTarget = config.from
        ? gsap.fromTo(elementRef.current, config.from, {
            ...config.to,
            ease: config.ease || "none",
            scrollTrigger: scrollTriggerConfig,
          })
        : gsap.to(elementRef.current, {
            ...config.to,
            ease: config.ease || "none",
            scrollTrigger: scrollTriggerConfig,
          });

      stTrigger = animationTarget.scrollTrigger;
    };

    initAnimation();

    return () => {
      if (stTrigger) stTrigger.kill();
    };
  }, [
    elementRef,
    config.trigger,
    config.start,
    config.end,
    config.scrub,
    config.pin,
    config.showMarkers,
    config.markerColor,
    config.ease,
    config.toggleActions,
    config.invalidateOnRefresh,
    config.from,
    config.to,
    fromStr,
    toStr,
  ]);
}

function ScrubAnimation({
  children,
  trigger,
  start,
  end,
  scrub,
  from,
  to,
  ease,
  pin,
  showMarkers,
  markerColor,
  toggleActions,
  invalidateOnRefresh,
  className,
}: ScrubAnimationProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useScrubAnimation(elementRef as RefObject<HTMLElement | null>, {
    trigger,
    start,
    end,
    scrub,
    from,
    to,
    ease,
    pin,
    showMarkers,
    markerColor,
    toggleActions,
    invalidateOnRefresh,
  });

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}

export default ScrubAnimation;
