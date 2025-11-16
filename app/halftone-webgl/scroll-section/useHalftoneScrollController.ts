"use client";

import {
  type CSSProperties,
  type MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CanvasHalftoneWebGLHandle } from "../../canvas/CanvasHalftoneWebGL";
import type { HalftoneSectionConfigInput } from "../halftoneTypes";
import { resolveHalftoneScrollConfig } from "./config";
import { resolveHalftoneParamsForCanvas, toRendererParams } from "./params";

type CanvasDimensions = {
  width: number;
  height: number;
};

type UseHalftoneScrollControllerResult = {
  scrollSectionRef: MutableRefObject<HTMLDivElement | null>;
  responsiveContainerRef: MutableRefObject<HTMLDivElement | null>;
  canvasRef: MutableRefObject<CanvasHalftoneWebGLHandle | null>;
  sectionStyle: CSSProperties;
  contentStyle: CSSProperties;
  canvasDimensions: CanvasDimensions;
  rendererInitialParams: ReturnType<typeof toRendererParams>;
  imageSrc: string;
};

export const useHalftoneScrollController = (
  config?: HalftoneSectionConfigInput
): UseHalftoneScrollControllerResult => {
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const responsiveContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<CanvasHalftoneWebGLHandle>(null);
  const translateYValueRef = useRef(0);

  const resolvedConfig = useMemo(
    () => resolveHalftoneScrollConfig(config),
    [config]
  );

  const {
    aspectRatio,
    responsiveWidthValue,
    fallbackCanvasSize,
    imageSrc,
    scroll,
    initialParams,
    targetParams,
  } = resolvedConfig;

  const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>(
    () => ({
      ...fallbackCanvasSize,
    })
  );

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
        ease: "power2.inOut",
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

  const sectionStyle = useMemo<CSSProperties>(
    () => ({
      width: responsiveWidthValue,
      aspectRatio: `${aspectRatio.width}/${aspectRatio.height * 2}`,
    }),
    [responsiveWidthValue, aspectRatio.width, aspectRatio.height]
  );

  const contentStyle = useMemo<CSSProperties>(
    () => ({
      width: responsiveWidthValue,
      aspectRatio: aspectRatio.css,
    }),
    [responsiveWidthValue, aspectRatio.css]
  );

  return {
    scrollSectionRef,
    responsiveContainerRef,
    canvasRef,
    sectionStyle,
    contentStyle,
    canvasDimensions,
    rendererInitialParams,
    imageSrc,
  };
};
