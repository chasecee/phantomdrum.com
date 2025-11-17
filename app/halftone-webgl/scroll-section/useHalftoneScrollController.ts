"use client";

import {
  type CSSProperties,
  type MutableRefObject,
  type RefObject,
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CanvasHalftoneWebGLHandle } from "../../canvas/CanvasHalftoneWebGL";
import type {
  HalftoneLayerConfig,
  HalftoneSectionConfigInput,
} from "../halftoneTypes";
import { resolveHalftoneScrollConfig } from "./config";
import { resolveHalftoneParamsForCanvas, toRendererParams } from "./params";

const ZERO_TRANSLATE_VALUES = new Set(["0", "0px", "0%", "+0", "-0"]);

const toTranslateCssValue = (value?: number | string): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || "0px";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value === 0) return "0px";
    return `${value}px`;
  }
  return "0px";
};

const isZeroTranslateValue = (value: string) =>
  ZERO_TRANSLATE_VALUES.has(value.replace(/\s+/g, ""));

type CanvasDimensions = {
  width: number;
  height: number;
};

type LayerRuntimeState = {
  imageSrc: string;
  imageFit: HalftoneLayerConfig["imageFit"];
  className?: string;
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<CanvasHalftoneWebGLHandle | null>;
  rendererInitialParams: ReturnType<typeof toRendererParams>;
};

type UseHalftoneScrollControllerResult = {
  scrollSectionRef: MutableRefObject<HTMLDivElement | null>;
  responsiveContainerRef: MutableRefObject<HTMLDivElement | null>;
  sectionStyle: CSSProperties;
  contentStyle: CSSProperties;
  canvasDimensions: CanvasDimensions;
  layers: LayerRuntimeState[];
};

export const useHalftoneScrollController = (
  config?: HalftoneSectionConfigInput
): UseHalftoneScrollControllerResult => {
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const responsiveContainerRef = useRef<HTMLDivElement>(null);
  const translateYValueRef = useRef("0px");

  const resolvedConfig = useMemo(
    () => resolveHalftoneScrollConfig(config),
    [config]
  );

  const {
    aspectRatio,
    responsiveWidthValue,
    fallbackCanvasSize,
    scroll,
    layers: configLayers,
    baseLayerIndex,
  } = resolvedConfig;

  const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>(
    () => ({
      ...fallbackCanvasSize,
    })
  );

  const canvasWidth = canvasDimensions.width || fallbackCanvasSize.width;
  const canvasHeight = canvasDimensions.height || fallbackCanvasSize.height;

  const layerCount = configLayers.length;

  const canvasRefs = useMemo<RefObject<CanvasHalftoneWebGLHandle | null>[]>(
    () =>
      Array.from({ length: layerCount }, () =>
        createRef<CanvasHalftoneWebGLHandle | null>()
      ),
    [layerCount]
  );

  const containerRefs = useMemo<RefObject<HTMLDivElement | null>[]>(
    () =>
      Array.from({ length: layerCount }, () =>
        createRef<HTMLDivElement | null>()
      ),
    [layerCount]
  );

  const resolvedLayerParams = useMemo(
    () =>
      configLayers.map((layer) => ({
        imageSrc: layer.imageSrc,
        imageFit: layer.imageFit,
        initial: resolveHalftoneParamsForCanvas(
          layer.initialParams,
          canvasWidth,
          canvasHeight
        ),
        target: resolveHalftoneParamsForCanvas(
          layer.targetParams,
          canvasWidth,
          canvasHeight
        ),
      })),
    [configLayers, canvasWidth, canvasHeight]
  );

  const rendererLayerInitialParams = useMemo(
    () => resolvedLayerParams.map((layer) => toRendererParams(layer.initial)),
    [resolvedLayerParams]
  );

  const layers = useMemo(
    () =>
      resolvedLayerParams.map((layer, index) => ({
        imageSrc: layer.imageSrc,
        imageFit: layer.imageFit,
        className: configLayers[index]?.className,
        containerRef: containerRefs[index],
        canvasRef: canvasRefs[index],
        rendererInitialParams: rendererLayerInitialParams[index],
      })),
    [
      canvasRefs,
      configLayers,
      containerRefs,
      rendererLayerInitialParams,
      resolvedLayerParams,
    ]
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

  const applyTranslateY = useCallback(
    (value?: number | string) => {
      const node = containerRefs[baseLayerIndex]?.current;
      if (!node) return;
      const nextValue = toTranslateCssValue(value);
      if (translateYValueRef.current === nextValue) return;
      translateYValueRef.current = nextValue;
      if (isZeroTranslateValue(nextValue)) {
        gsap.set(node, { clearProps: "transform,willChange" });
        return;
      }
      gsap.set(node, { y: nextValue, willChange: "transform" });
    },
    [baseLayerIndex, containerRefs]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!scrollSectionRef.current) return;
    if (!resolvedLayerParams.length) return;
    gsap.registerPlugin(ScrollTrigger);

    const baseIndex = Math.min(
      Math.max(baseLayerIndex, 0),
      resolvedLayerParams.length - 1
    );
    const proxies = resolvedLayerParams.map((layer) => ({ ...layer.initial }));
    let rafId: number | null = null;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: {
          ease: "linear",
        },
        scrollTrigger: {
          trigger: scrollSectionRef.current,
          start: scroll.start,
          end: scroll.end,
          scrub: scroll.scrub,
          invalidateOnRefresh: true,
          markers: scroll.markers,
        },
      });

      proxies.forEach((proxy, index) => {
        const target = resolvedLayerParams[index]?.target;
        if (!target) return;
        timeline.to(
          proxy,
          {
            halftoneSize: target.halftoneSize,
            dotSpacing: target.dotSpacing,
            rgbOffset: target.rgbOffset,
            rgbOffsetAngle: target.rgbOffsetAngle,
            effectIntensity: target.effectIntensity,
            patternRotation: target.patternRotation,
            zoom: target.zoom,
            translateY: target.translateY,
          },
          0
        );
      });

      timeline.eventCallback("onUpdate", () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          applyTranslateY(proxies[baseIndex]?.translateY);
          proxies.forEach((proxy, index) => {
            const ref = canvasRefs[index]?.current;
            if (ref) {
              ref.updateParams(toRendererParams(proxy));
            }
          });
        });
      });
    }, scrollSectionRef);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      ctx.revert();
    };
  }, [
    applyTranslateY,
    baseLayerIndex,
    canvasRefs,
    resolvedLayerParams,
    scroll,
  ]);

  useEffect(() => {
    if (!resolvedLayerParams.length) return;
    const baseIndex = Math.min(
      Math.max(baseLayerIndex, 0),
      resolvedLayerParams.length - 1
    );
    applyTranslateY(resolvedLayerParams[baseIndex].initial.translateY);
  }, [applyTranslateY, baseLayerIndex, resolvedLayerParams]);

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
      aspectRatio: `${aspectRatio.width}/${aspectRatio.height * 1}`,
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
    sectionStyle,
    contentStyle,
    canvasDimensions,
    layers,
  };
};
