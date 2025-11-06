"use client";

import { useEffect, useRef, RefObject, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
  filterStyle?: string;
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

    const element = elementRef.current;

    if (config.from) {
      gsap.set(element, {
        ...config.from,
        force3D: true,
        willChange: "transform",
        z: 0,
      });
    }

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
      anticipatePin: 1,
      ...markerConfig,
    };

    if (config.toggleActions) {
      scrollTriggerConfig.toggleActions = config.toggleActions;
    } else {
      scrollTriggerConfig.scrub =
        typeof config.scrub === "number"
          ? config.scrub
          : config.scrub
          ? 1
          : false;
    }

    const animationTarget = config.from
      ? gsap.to(element, {
          ...config.to,
          ease: config.ease || "none",
          force3D: true,
          immediateRender: false,
          scrollTrigger: scrollTriggerConfig,
        })
      : gsap.to(element, {
          ...config.to,
          ease: config.ease || "none",
          force3D: true,
          immediateRender: false,
          scrollTrigger: scrollTriggerConfig,
        });

    return () => {
      if (animationTarget.scrollTrigger) {
        animationTarget.scrollTrigger.kill();
      }
      animationTarget.kill();
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
  filterStyle,
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
    <div
      ref={elementRef}
      className={className}
      style={{
        willChange: "transform",
        ...(filterStyle ? { filter: filterStyle } : {}),
      }}
    >
      {children}
    </div>
  );
}

export default ScrubAnimation;
