"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  createRef,
  type CSSProperties,
  type MutableRefObject,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CanvasHalftoneWebGLHandle,
  HalftoneWebGLParams,
} from "../../canvas/CanvasHalftoneWebGL";
import type {
  HalftoneLayerDefinition,
  HalftoneSceneConfig,
  LayerParamSet,
  ResponsiveNumeric,
} from "./types";

type CanvasDimensions = {
  width: number;
  height: number;
};

type NormalizedLayerDefinition = {
  id: string;
  imageSrc: string;
  imageFit: "cover" | "contain";
  placement: "background" | "foreground";
  className?: string;
  padding: number;
  params: HalftoneLayerDefinition["params"];
};

type TranslateMeta = {
  unit: "percent" | "px";
  basis: number;
};

type ResolvedParamPayload = {
  renderer: HalftoneWebGLParams;
  translateYValue: number;
  translateYMeta: TranslateMeta;
};

type ResolvedLayerParams = {
  initial: ResolvedParamPayload;
  target: ResolvedParamPayload;
};

type RuntimeLayer = {
  key: string;
  imageSrc: string;
  imageFit: "cover" | "contain";
  className?: string;
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<CanvasHalftoneWebGLHandle | null>;
  zIndex: number;
  initialRendererParams: HalftoneWebGLParams;
  paddingRatio: number;
};

type UseHalftoneSceneResult = {
  sectionRef: MutableRefObject<HTMLDivElement | null>;
  contentRef: MutableRefObject<HTMLDivElement | null>;
  sectionStyle: CSSProperties;
  contentStyle: CSSProperties;
  canvasDimensions: CanvasDimensions;
  contentDimensions: CanvasDimensions;
  layers: RuntimeLayer[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const DEFAULT_RENDERER_PARAMS: HalftoneWebGLParams = {
  halftoneSize: 6,
  dotSpacing: 16,
  rgbOffset: 0.8,
  rgbOffsetAngle: 45,
  effectIntensity: 0.2,
  brightness: 1,
  contrast: 1,
  patternRotation: 45,
  zoom: 1,
};

const normalizeLayer = (
  layer: HalftoneLayerDefinition,
  index: number,
  globalPadding: number
): NormalizedLayerDefinition => ({
  id: layer.id ?? `layer-${index}`,
  imageSrc: layer.imageSrc,
  imageFit: layer.imageFit ?? "cover",
  placement: layer.placement ?? "foreground",
  className: layer.className,
  padding: layer.padding ?? globalPadding,
  params: layer.params,
});

const resolveBaseLayerIndex = (
  requested: number | undefined,
  layers: NormalizedLayerDefinition[]
) => {
  if (
    typeof requested === "number" &&
    requested >= 0 &&
    requested < layers.length
  ) {
    return requested;
  }
  const firstForeground = layers.findIndex(
    (layer) => layer.placement !== "background"
  );
  return firstForeground === -1 ? 0 : firstForeground;
};

const isPercentValue = (value: string) => value.trim().endsWith("%");

const toResponsiveNumber = (
  value: ResponsiveNumeric | undefined,
  basis: number
) => {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0;
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const numericPortion = isPercentValue(trimmed)
      ? trimmed.slice(0, -1)
      : trimmed;
    const numeric = Number(numericPortion);
    if (!Number.isFinite(numeric)) return 0;
    if (isPercentValue(trimmed)) {
      return (numeric / 100) * basis;
    }
    return numeric;
  }
  return 0;
};

const resolveParamSet = (
  params: LayerParamSet,
  widthBasis: number,
  heightBasis: number
): ResolvedParamPayload => {
  const translateInput = params.translateY ?? 0;
  const isPercent =
    typeof translateInput === "string" && translateInput.trim().endsWith("%");
  const translateYValue = toResponsiveNumber(translateInput, heightBasis);

  return {
    renderer: {
      halftoneSize: toResponsiveNumber(params.halftoneSize, widthBasis),
      dotSpacing: toResponsiveNumber(params.dotSpacing, widthBasis),
      rgbOffset: toResponsiveNumber(params.rgbOffset, widthBasis),
      rgbOffsetAngle: params.rgbOffsetAngle,
      effectIntensity: params.effectIntensity,
      patternRotation: params.patternRotation,
      zoom: params.zoom,
      brightness: params.brightness ?? 1,
      contrast: params.contrast ?? 1,
    },
    translateYValue,
    translateYMeta: {
      unit: isPercent ? "percent" : "px",
      basis: heightBasis,
    },
  };
};

const resolveLayerParams = (
  params: HalftoneLayerDefinition["params"],
  width: number,
  height: number
): ResolvedLayerParams => ({
  initial: resolveParamSet(params.initial, width, height),
  target: resolveParamSet(params.target, width, height),
});

const toSectionAspectRatio = (aspectRatio: number) => `${1}/${aspectRatio}`;

const toContentAspectRatio = (aspectRatio: number) => `${1}/${aspectRatio}`;

export const useHalftoneScene = (
  config: HalftoneSceneConfig
): UseHalftoneSceneResult => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const translateValueRef = useRef<number>(0);

  const normalized = useMemo(() => {
    const aspectRatio = Math.max(config.aspectRatio || 1, 0.2);
    const widthMin = Math.max(config.width.min || 1, 200);
    const widthMax = Math.max(widthMin, config.width.max || widthMin);
    const viewportRatio = clamp(config.width.viewportRatio ?? 1, 0.3, 1);
    const padding = clamp(config.padding ?? 0, 0, 0.45);
    const layers = config.layers.map((layer, index) =>
      normalizeLayer(layer, index, padding)
    );
    const baseLayerIndex = resolveBaseLayerIndex(config.baseLayerIndex, layers);
    const widthValue = "100%";

    return {
      aspectRatio,
      width: {
        min: widthMin,
        max: widthMax,
        viewportRatio,
        value: widthValue,
      },
      scroll: {
        start: config.scroll.start,
        end: config.scroll.end,
        scrub: config.scroll.scrub,
        markers: config.scroll.markers ?? false,
      },
      layers,
      baseLayerIndex,
      padding,
    };
  }, [config]);

  const fallbackMeasurements = useMemo(() => {
    const measuredWidth = normalized.width.max;
    const measuredHeight = Math.round(measuredWidth * normalized.aspectRatio);
    const paddingPx = Math.round(measuredWidth * normalized.padding);
    const innerWidth = Math.max(1, measuredWidth - paddingPx * 2);
    const innerHeight = Math.max(1, measuredHeight - paddingPx * 2);
    return {
      canvas: { width: measuredWidth, height: measuredHeight },
      inner: { width: innerWidth, height: innerHeight },
    };
  }, [normalized.aspectRatio, normalized.padding, normalized.width.max]);

  const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>(
    fallbackMeasurements.canvas
  );
  const [contentDimensions, setContentDimensions] = useState<CanvasDimensions>(
    fallbackMeasurements.inner
  );

  useEffect(() => {
    setCanvasDimensions(fallbackMeasurements.canvas);
    setContentDimensions(fallbackMeasurements.inner);
  }, [fallbackMeasurements]);

  const layerCount = normalized.layers.length;

  const canvasRefs = useMemo<
    RefObject<CanvasHalftoneWebGLHandle | null>[]
  >(() => {
    return Array.from({ length: layerCount }, () =>
      createRef<CanvasHalftoneWebGLHandle | null>()
    );
  }, [layerCount]);

  const containerRefs = useMemo<RefObject<HTMLDivElement | null>[]>(() => {
    return Array.from({ length: layerCount }, () =>
      createRef<HTMLDivElement | null>()
    );
  }, [layerCount]);

  const resolvedLayerParams = useMemo<ResolvedLayerParams[]>(() => {
    const widthBasis = Math.max(1, contentDimensions.width);
    const heightBasis = Math.max(1, contentDimensions.height);
    return normalized.layers.map((layer) =>
      resolveLayerParams(layer.params, widthBasis, heightBasis)
    );
  }, [contentDimensions.height, contentDimensions.width, normalized.layers]);

  const runtimeLayers = useMemo<RuntimeLayer[]>(
    () =>
      normalized.layers.map((layer, index) => ({
        key: layer.id,
        imageSrc: layer.imageSrc,
        imageFit: layer.imageFit,
        className: layer.className,
        containerRef: containerRefs[index],
        canvasRef: canvasRefs[index],
        zIndex: index + 1,
        initialRendererParams:
          resolvedLayerParams[index]?.initial.renderer ??
          DEFAULT_RENDERER_PARAMS,
        paddingRatio: clamp(layer.padding, 0, 0.45),
      })),
    [canvasRefs, containerRefs, normalized.layers, resolvedLayerParams]
  );

  const updateCanvasSize = useCallback(() => {
    const node = contentRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      const measuredWidth = Math.max(1, Math.round(node.offsetWidth));
      if (!measuredWidth) return;
      const measuredHeight = Math.max(
        1,
        Math.round(measuredWidth * normalized.aspectRatio)
      );
      const paddingPx = Math.round(measuredWidth * normalized.padding);
      const innerWidth = Math.max(1, measuredWidth - paddingPx * 2);
      const innerHeight = Math.max(1, measuredHeight - paddingPx * 2);

      setCanvasDimensions((prev) => {
        if (prev.width === measuredWidth && prev.height === measuredHeight) {
          return prev;
        }
        return {
          width: measuredWidth,
          height: measuredHeight,
        };
      });

      setContentDimensions((prev) => {
        if (prev.width === innerWidth && prev.height === innerHeight) {
          return prev;
        }
        return {
          width: innerWidth,
          height: innerHeight,
        };
      });
    });
  }, [normalized.aspectRatio, normalized.padding]);

  const applyTranslateY = useCallback(
    (value: number, meta?: TranslateMeta | null) => {
      const baseRef = containerRefs[normalized.baseLayerIndex]?.current;
      if (!baseRef) return;
      if (Math.abs(translateValueRef.current - value) < 0.5) return;
      translateValueRef.current = value;
      if (Math.abs(value) < 0.5) {
        gsap.set(baseRef, { clearProps: "transform,willChange" });
        return;
      }
      const cssValue =
        meta && meta.unit === "percent" && meta.basis > 0
          ? `${(value / meta.basis) * 100}%`
          : `${value}px`;
      gsap.set(baseRef, { y: cssValue, willChange: "transform" });
    },
    [containerRefs, normalized.baseLayerIndex]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = contentRef.current;
    if (!target) return;
    updateCanvasSize();
    if (!("ResizeObserver" in window)) return;
    const observer = new ResizeObserver(() => updateCanvasSize());
    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [updateCanvasSize]);

  useEffect(() => {
    if (!resolvedLayerParams.length) return;
    const initialTranslate =
      resolvedLayerParams[normalized.baseLayerIndex]?.initial.translateYValue ??
      0;
    const initialMeta =
      resolvedLayerParams[normalized.baseLayerIndex]?.initial.translateYMeta;
    applyTranslateY(initialTranslate, initialMeta);
  }, [applyTranslateY, normalized.baseLayerIndex, resolvedLayerParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sectionRef.current) return;
    if (!resolvedLayerParams.length) return;
    gsap.registerPlugin(ScrollTrigger);

    const proxies = resolvedLayerParams.map((layer) => ({
      ...layer.initial.renderer,
      translateYValue: layer.initial.translateYValue,
      translateYMeta: layer.initial.translateYMeta,
    }));

    let rafId: number | null = null;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: {
          ease: "linear",
        },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: normalized.scroll.start,
          end: normalized.scroll.end,
          scrub: normalized.scroll.scrub,
          invalidateOnRefresh: true,
          markers: normalized.scroll.markers,
        },
      });

      resolvedLayerParams.forEach((layer, index) => {
        timeline.to(
          proxies[index],
          {
            ...layer.target.renderer,
            translateYValue: layer.target.translateYValue,
          },
          0
        );
      });

      timeline.eventCallback("onUpdate", () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          applyTranslateY(
            proxies[normalized.baseLayerIndex]?.translateYValue ?? 0,
            proxies[normalized.baseLayerIndex]?.translateYMeta
          );
          proxies.forEach((proxy, index) => {
            const ref = canvasRefs[index]?.current;
            if (!ref) return;
            const { translateYValue, translateYMeta, ...params } = proxy;
            void translateYValue;
            void translateYMeta;
            ref.updateParams(params);
          });
        });
      });
    }, sectionRef);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      ctx.revert();
    };
  }, [
    applyTranslateY,
    canvasRefs,
    normalized.baseLayerIndex,
    normalized.scroll,
    resolvedLayerParams,
  ]);

  const sectionStyle = useMemo<CSSProperties>(
    () => ({
      width: normalized.width.value,
      aspectRatio: toSectionAspectRatio(normalized.aspectRatio),
    }),
    [normalized.aspectRatio, normalized.width.value]
  );

  const contentStyle = useMemo<CSSProperties>(
    () => ({
      width: normalized.width.value,
      aspectRatio: toContentAspectRatio(normalized.aspectRatio),
    }),
    [normalized.aspectRatio, normalized.width.value]
  );

  return {
    sectionRef,
    contentRef,
    sectionStyle,
    contentStyle,
    canvasDimensions,
    contentDimensions,
    layers: runtimeLayers,
  };
};
