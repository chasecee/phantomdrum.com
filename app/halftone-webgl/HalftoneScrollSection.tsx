"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CanvasHalftoneWebGL,
  type CanvasHalftoneWebGLHandle,
} from "../canvas/CanvasHalftoneWebGL";
import type {
  AspectRatioInput,
  HalftoneParamsPreset,
  ScrollTriggerSettings,
  HalftoneSectionConfig,
  HalftoneSectionConfigInput,
  HalftoneScrollSectionProps,
  ResolvedAspectRatio,
} from "./halftoneTypes";

const DEFAULT_ASPECT_RATIO_BASE = { width: 1, height: 1.1 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const sanitizeDimension = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const createAspectRatioValue = (
  width: number,
  height: number
): ResolvedAspectRatio => {
  const resolvedWidth = sanitizeDimension(
    width,
    DEFAULT_ASPECT_RATIO_BASE.width
  );
  const resolvedHeight = sanitizeDimension(
    height,
    DEFAULT_ASPECT_RATIO_BASE.height
  );
  const scalar = resolvedHeight / resolvedWidth;
  return {
    width: resolvedWidth,
    height: resolvedHeight,
    scalar,
    css: `${resolvedWidth}/${resolvedHeight}`,
  };
};

const DEFAULT_ASPECT_RATIO = createAspectRatioValue(
  DEFAULT_ASPECT_RATIO_BASE.width,
  DEFAULT_ASPECT_RATIO_BASE.height
);

const DEFAULT_INITIAL_PARAMS: HalftoneParamsPreset = {
  halftoneSize: 44,
  dotSpacing: 2,
  rgbOffset: -250,
  rgbOffsetAngle: -90,
  effectIntensity: 1,
  patternRotation: 55,
  zoom: 2,
};

const DEFAULT_TARGET_PARAMS: HalftoneParamsPreset = {
  halftoneSize: 9,
  dotSpacing: 1,
  rgbOffset: 0,
  rgbOffsetAngle: 45,
  effectIntensity: 0,
  patternRotation: 55,
  zoom: 0.66,
};

const DEFAULT_PATTERN_ROTATION = DEFAULT_INITIAL_PARAMS.patternRotation;

const DEFAULT_SCROLL_SETTINGS: ScrollTriggerSettings = {
  start: "0% 50%",
  end: "30% 0%",
  scrub: true,
  markers: true,
};

const DEFAULT_CONFIG = {
  aspectRatio: DEFAULT_ASPECT_RATIO,
  viewportWidthRatio: 1,
  maxWidth: 1080,
  minWidth: 320,
  keepImageInView: true,
  imageSrc: "/img/optimized/planet-cropped.webp",
  scroll: DEFAULT_SCROLL_SETTINGS,
  initialParams: DEFAULT_INITIAL_PARAMS,
  targetParams: DEFAULT_TARGET_PARAMS,
};

const parseDelimitedRatio = (value: string): [number, number] | null => {
  const normalized = value.replace(/\s+/g, "");
  const delimiter = normalized.includes(":")
    ? ":"
    : normalized.includes("/")
    ? "/"
    : null;
  if (!delimiter) return null;
  const [rawWidth, rawHeight] = normalized.split(delimiter);
  const width = Number(rawWidth);
  const height = Number(rawHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return [width, height];
};

const resolveAspectRatio = (value?: AspectRatioInput): ResolvedAspectRatio => {
  if (typeof value === "number") {
    return value > 0 ? createAspectRatioValue(1, value) : DEFAULT_ASPECT_RATIO;
  }
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return createAspectRatioValue(1, numeric);
    }
    const parsedPair = parseDelimitedRatio(value);
    if (parsedPair) {
      return createAspectRatioValue(parsedPair[0], parsedPair[1]);
    }
    return DEFAULT_ASPECT_RATIO;
  }
  if (value && typeof value === "object") {
    return createAspectRatioValue(value.width, value.height);
  }
  return DEFAULT_ASPECT_RATIO;
};

const createResponsiveWidthValue = (
  minWidth: number,
  maxWidth: number,
  viewportWidthRatio: number
) =>
  `clamp(${minWidth}px, ${(viewportWidthRatio * 100).toFixed(
    2
  )}vw, ${maxWidth}px)`;

const resolveParams = (
  base: HalftoneParamsPreset,
  overrides: Partial<HalftoneParamsPreset> | undefined,
  rotation: number
): HalftoneParamsPreset => {
  const merged = { ...base, ...overrides };
  if (overrides?.patternRotation === undefined) {
    merged.patternRotation = rotation;
  }
  return merged;
};

const resolveConfig = (
  config?: HalftoneSectionConfigInput
): HalftoneSectionConfig => {
  const aspectRatio = resolveAspectRatio(
    config?.aspectRatio ?? DEFAULT_CONFIG.aspectRatio
  );
  const viewportWidthRatio = clamp(
    config?.viewportWidthRatio ?? DEFAULT_CONFIG.viewportWidthRatio,
    0.1,
    1
  );
  const maxWidth = Math.max(config?.maxWidth ?? DEFAULT_CONFIG.maxWidth, 1);
  const minWidth = Math.min(
    Math.max(config?.minWidth ?? DEFAULT_CONFIG.minWidth, 1),
    maxWidth
  );
  const keepImageInView =
    config?.keepImageInView ?? DEFAULT_CONFIG.keepImageInView;
  const imageSrc = config?.imageSrc ?? DEFAULT_CONFIG.imageSrc;
  const fallbackPatternRotation =
    config?.patternRotation ??
    config?.params?.initial?.patternRotation ??
    config?.params?.target?.patternRotation ??
    DEFAULT_PATTERN_ROTATION;
  const scroll: ScrollTriggerSettings = {
    start: config?.scroll?.start ?? DEFAULT_CONFIG.scroll.start,
    end: config?.scroll?.end ?? DEFAULT_CONFIG.scroll.end,
    scrub: config?.scroll?.scrub ?? DEFAULT_CONFIG.scroll.scrub,
    markers: config?.scroll?.markers ?? DEFAULT_CONFIG.scroll.markers,
  };
  const initialParams = resolveParams(
    DEFAULT_CONFIG.initialParams,
    config?.params?.initial,
    fallbackPatternRotation
  );
  const targetParams = resolveParams(
    DEFAULT_CONFIG.targetParams,
    config?.params?.target,
    fallbackPatternRotation
  );
  const responsiveWidthValue = createResponsiveWidthValue(
    minWidth,
    maxWidth,
    viewportWidthRatio
  );
  const fallbackCanvasSize = {
    width: maxWidth,
    height: Math.round(maxWidth * aspectRatio.scalar),
  };

  return {
    aspectRatio,
    responsiveWidthValue,
    fallbackCanvasSize,
    keepImageInView,
    imageSrc,
    scroll,
    initialParams,
    targetParams,
  };
};

export function HalftoneScrollSection({
  config,
}: HalftoneScrollSectionProps = {}) {
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<CanvasHalftoneWebGLHandle>(null);
  const responsiveContainerRef = useRef<HTMLDivElement>(null);

  const {
    aspectRatio,
    responsiveWidthValue,
    fallbackCanvasSize,
    keepImageInView,
    imageSrc,
    scroll,
    initialParams,
    targetParams,
  } = useMemo(() => resolveConfig(config), [config]);

  const [canvasDimensions, setCanvasDimensions] = useState(() => ({
    ...fallbackCanvasSize,
  }));

  const updateCanvasSize = useCallback(() => {
    const node = responsiveContainerRef.current;
    if (!node) return;
    const width = node.offsetWidth;
    if (!width) return;
    const nextWidth = Math.max(1, Math.round(width));
    const nextHeight = Math.max(1, Math.round(width * aspectRatio.scalar));
    setCanvasDimensions((prev) => {
      if (prev.width === nextWidth && prev.height === nextHeight) {
        return prev;
      }
      return {
        width: nextWidth,
        height: nextHeight,
      };
    });
  }, [aspectRatio.scalar]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!scrollSectionRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const proxy = { ...initialParams };
    let rafId: number | null = null;

    const ctx = gsap.context(() => {
      gsap.to(proxy, {
        halftoneSize: targetParams.halftoneSize,
        dotSpacing: targetParams.dotSpacing,
        rgbOffset: targetParams.rgbOffset,
        effectIntensity: targetParams.effectIntensity,
        patternRotation: targetParams.patternRotation,
        zoom: targetParams.zoom,
        ease: "linear",
        scrollTrigger: {
          trigger: scrollSectionRef.current,
          start: scroll.start,
          end: scroll.end,
          scrub: scroll.scrub,
          invalidateOnRefresh: true,
          markers: scroll.markers,
        },
        onUpdate: () => {
          if (!canvasRef.current || rafId !== null) return;
          rafId = requestAnimationFrame(() => {
            rafId = null;
            canvasRef.current?.updateParams(proxy);
          });
        },
      });
    }, scrollSectionRef);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      ctx.revert();
    };
  }, [initialParams, scroll, targetParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = responsiveContainerRef.current;
    if (!target) return;
    updateCanvasSize();
    if (!("ResizeObserver" in window)) {
      return;
    }
    const observer = new ResizeObserver(() => {
      updateCanvasSize();
    });
    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [updateCanvasSize]);

  return (
    <section
      ref={scrollSectionRef}
      className="w-full relative  "
      style={{
        width: responsiveWidthValue,
        aspectRatio: `${aspectRatio.width}/${aspectRatio.height * 2}`,
      }}
    >
      <div
        className="sticky top-0 flex w-full justify-center"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 15%)",
          maskSize: "100% 100%",
          maskPosition: "top",
          maskRepeat: "no-repeat",
        }}
      >
        <div
          ref={responsiveContainerRef}
          className="mx-auto"
          style={{
            width: responsiveWidthValue,
            aspectRatio: aspectRatio.css,
          }}
        >
          <CanvasHalftoneWebGL
            ref={canvasRef}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            imageSrc={imageSrc}
            params={initialParams}
            suspendWhenHidden={false}
            imageFit={keepImageInView ? "contain" : "cover"}
            className="w-full h-full border-0 border-purple-500"
          />
        </div>
      </div>
    </section>
  );
}
