"use client";

import {
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import type { ScrollTrigger as ScrollTriggerInstance } from "gsap/ScrollTrigger";
import { getGSAP, getScrollTrigger } from "@/app/lib/gsap";

type ScrollTriggerConfig = Partial<ScrollTriggerInstance["vars"]>;
type TweenVars = gsap.TweenVars;
type GsapTween = gsap.core.Tween;

export type TweenDefinition = { from?: TweenVars; to: TweenVars };
export type TweenBuilder = (element: HTMLElement) => TweenDefinition;
type ContainerProps = Omit<HTMLAttributes<HTMLDivElement>, "ref" | "children">;

export type ScrubAnimationProps = {
  children: ReactNode;
  containerProps?: ContainerProps;
  from?: TweenVars;
  to?: TweenVars;
  tween?: TweenBuilder;
  scrollTrigger?: ScrollTriggerConfig;
  markerColor?: string;
};

export default function ScrubAnimation({
  children,
  containerProps,
  from,
  to,
  tween,
  scrollTrigger,
  markerColor,
}: ScrubAnimationProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!elementRef.current) {
      return;
    }
    if (!tween && !to) {
      return;
    }

    let cancelled = false;
    let animation: GsapTween | null = null;

    const init = async () => {
      const gsapInstance = await getGSAP();
      await getScrollTrigger();
      const target = elementRef.current;
      if (!target || cancelled) {
        return;
      }

      let tweenConfig: TweenDefinition | null = null;
      if (tween) {
        tweenConfig = tween(target);
      } else if (to) {
        tweenConfig = { from, to };
      }

      if (!tweenConfig?.to) {
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion) {
        gsapInstance.set(target, tweenConfig.to);
        return;
      }

      const scrollConfig = scrollTrigger ?? {};
      const { trigger, scrub, ...restConfig } = scrollConfig;
      const resolvedTrigger = trigger ?? target;
      const resolvedScrub = typeof scrub === "undefined" ? true : scrub;
      const resolvedMarkers =
        markerColor == null
          ? restConfig.markers
          : {
              ...(typeof restConfig.markers === "object"
                ? restConfig.markers
                : {}),
              startColor: markerColor,
              endColor: markerColor,
            };

      animation = gsapInstance.fromTo(target, tweenConfig.from ?? {}, {
        ...tweenConfig.to,
        scrollTrigger: {
          ...restConfig,
          markers: resolvedMarkers,
          trigger: resolvedTrigger,
          scrub: resolvedScrub,
        },
      });
    };

    init();

    return () => {
      cancelled = true;
      animation?.scrollTrigger?.kill();
      animation?.kill();
    };
  }, [from, to, tween, scrollTrigger]);

  const mergedContainerProps = containerProps ?? {};

  return (
    <div
      {...mergedContainerProps}
      ref={(node: HTMLDivElement | null) => {
        elementRef.current = node;
      }}
    >
      {children}
    </div>
  );
}
