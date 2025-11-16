"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CanvasHalftoneWebGL,
  type CanvasHalftoneWebGLHandle,
  type HalftoneWebGLParams,
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

const DEFAULT_ASPECT_RATIO_BASE = { width: 1, height: 1.5 };

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
  halftoneSize: "1%",
  dotSpacing: ".1%",
  rgbOffset: "20%",
  rgbOffsetAngle: 90,
  effectIntensity: 1,
  patternRotation: 55,
  zoom: 2,
  translateY: "0%",
};

const DEFAULT_TARGET_PARAMS: HalftoneParamsPreset = {
  halftoneSize: "0.83%",
  dotSpacing: "0.09%",
  rgbOffset: "0%",
  rgbOffsetAngle: 45,
  effectIntensity: 0,
  patternRotation: 55,
  zoom: 0.66,
  translateY: "32%",
};

type ResolvedHalftoneParams = Omit<
  HalftoneParamsPreset,
  "halftoneSize" | "dotSpacing" | "rgbOffset" | "translateY"
> & {
  halftoneSize: number;
  dotSpacing: number;
  rgbOffset: number;
  translateY: number;
};

const isPercentValue = (value: string) => value.trim().endsWith("%");

const resolveResponsiveParamValue = (
  value: HalftoneParamsPreset["halftoneSize"],
  basis: number
) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const numericPortion = isPercentValue(trimmed)
      ? trimmed.slice(0, -1)
      : trimmed;
    const numeric = Number(numericPortion);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    if (isPercentValue(trimmed)) {
      return (numeric / 100) * basis;
    }
    return numeric;
  }
  return value;
};

const resolveHalftoneParamsForCanvas = (
  params: HalftoneParamsPreset,
  widthBasis: number,
  heightBasis: number
): ResolvedHalftoneParams => {
  const resolvedWidth = Math.max(1, widthBasis);
  const resolvedHeight = Math.max(1, heightBasis);
  return {
    ...params,
    halftoneSize: resolveResponsiveParamValue(
      params.halftoneSize,
      resolvedWidth
    ),
    dotSpacing: resolveResponsiveParamValue(params.dotSpacing, resolvedWidth),
    rgbOffset: resolveResponsiveParamValue(params.rgbOffset, resolvedWidth),
    translateY: resolveResponsiveParamValue(params.translateY, resolvedHeight),
  };
};

const toRendererParams = (
  params: ResolvedHalftoneParams
): Partial<HalftoneWebGLParams> => {
  const { translateY: _translateY, ...rest } = params;
  void _translateY;
  return rest;
};

const DEFAULT_PATTERN_ROTATION = DEFAULT_INITIAL_PARAMS.patternRotation;

const DEFAULT_SCROLL_SETTINGS: ScrollTriggerSettings = {
  start: "15% 28%",
  end: "80% 0%",
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
  const translateYValueRef = useRef(0);

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

  const canvasWidth = canvasDimensions.width || fallbackCanvasSize.width;

  const canvasHeight = canvasDimensions.height || fallbackCanvasSize.height;

  const resolvedInitialParams = useMemo(
    () =>
      resolveHalftoneParamsForCanvas(initialParams, canvasWidth, canvasHeight),
    [initialParams, canvasWidth, canvasHeight]
  );

  const resolvedTargetParams = useMemo(
    () =>
      resolveHalftoneParamsForCanvas(targetParams, canvasWidth, canvasHeight),
    [targetParams, canvasWidth, canvasHeight]
  );

  const rendererInitialParams = useMemo(
    () => toRendererParams(resolvedInitialParams),
    [resolvedInitialParams]
  );

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

  const applyTranslateY = useCallback((value?: number) => {
    const node = responsiveContainerRef.current;
    if (!node) return;
    const nextValue = Number.isFinite(value) ? Number(value) : 0;
    if (translateYValueRef.current === nextValue) return;
    translateYValueRef.current = nextValue;
    if (nextValue === 0) {
      node.style.transform = "";
      node.style.willChange = "";
      return;
    }
    node.style.transform = `translate3d(0, ${nextValue}px, 0)`;
    node.style.willChange = "transform";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!scrollSectionRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const proxy = { ...resolvedInitialParams };
    let rafId: number | null = null;

    const ctx = gsap.context(() => {
      gsap.to(proxy, {
        halftoneSize: resolvedTargetParams.halftoneSize,
        dotSpacing: resolvedTargetParams.dotSpacing,
        rgbOffset: resolvedTargetParams.rgbOffset,
        effectIntensity: resolvedTargetParams.effectIntensity,
        patternRotation: resolvedTargetParams.patternRotation,
        zoom: resolvedTargetParams.zoom,
        translateY: resolvedTargetParams.translateY,
        ease: "power1.inOut",
        scrollTrigger: {
          trigger: scrollSectionRef.current,
          start: scroll.start,
          end: scroll.end,
          scrub: scroll.scrub,
          invalidateOnRefresh: true,
          markers: scroll.markers,
        },
        onUpdate: () => {
          if (rafId !== null) return;
          rafId = requestAnimationFrame(() => {
            rafId = null;
            applyTranslateY(proxy.translateY);
            if (canvasRef.current) {
              canvasRef.current.updateParams(toRendererParams(proxy));
            }
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
  }, [applyTranslateY, resolvedInitialParams, resolvedTargetParams, scroll]);

  useEffect(() => {
    applyTranslateY(resolvedInitialParams.translateY);
  }, [applyTranslateY, resolvedInitialParams.translateY]);

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
        aspectRatio: `${aspectRatio.width}/${aspectRatio.height * 1}`,
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
            params={rendererInitialParams}
            suspendWhenHidden={false}
            imageFit={keepImageInView ? "contain" : "cover"}
            className="w-full h-full"
          />
        </div>
      </div>
    </section>
  );
}
