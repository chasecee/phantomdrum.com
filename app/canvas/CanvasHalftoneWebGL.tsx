"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import { HalftoneRendererCore } from "../halftone-webgl/scroll-section/HalftoneRendererCore";

export type HalftoneWebGLParams = {
  halftoneSize: number;
  dotSpacing: number;
  rgbOffset: number;
  rgbOffsetAngle: number;
  effectIntensity: number;
  brightness: number;
  contrast: number;
  patternRotation: number;
  zoom: number;
};

export type CanvasHalftoneWebGLProps = {
  width?: number;
  height?: number;
  imageSrc: string;
  params?: Partial<HalftoneWebGLParams>;
  className?: string;
  style?: React.CSSProperties;
  suspendWhenHidden?: boolean;
  imageFit?: "cover" | "contain";
  paddingRatio?: number;
};

export type CanvasHalftoneWebGLHandle = {
  updateParams: (params: Partial<HalftoneWebGLParams>) => void;
};

const DEFAULT_PARAMS: HalftoneWebGLParams = {
  halftoneSize: 6,
  dotSpacing: 16,
  rgbOffset: 0.8,
  rgbOffsetAngle: 45,
  effectIntensity: 1,
  brightness: 1,
  contrast: 1,
  patternRotation: 45,
  zoom: 1,
};

type WorkerParamPayload = {
  halftoneSize: number;
  dotSpacing: number;
  rgbOffset: number;
  rgbOffsetAngle: number;
  effectIntensity: number;
  brightness: number;
  contrast: number;
  patternRotation: number;
  zoom: number;
};

const degToRad = (value: number) => (value * Math.PI) / 180;
const clampDevicePixelRatio = (value: number) => Math.min(value || 1, 1.5);
const resolveImageSrc = (src: string) => {
  if (typeof window === "undefined") return src;
  try {
    return new URL(src, window.location.origin).toString();
  } catch {
    return src;
  }
};
const clampPaddingRatio = (ratio: number) => Math.min(Math.max(ratio, 0), 0.45);
const resolvePaddingPixels = (canvasWidth: number, ratio: number) => {
  if (!Number.isFinite(canvasWidth) || canvasWidth <= 0) return 0;
  return Math.max(0, Math.round(canvasWidth * clampPaddingRatio(ratio)));
};

const mergeParamsWithDefaults = (
  params?: Partial<HalftoneWebGLParams>
): WorkerParamPayload => ({
  halftoneSize: params?.halftoneSize ?? DEFAULT_PARAMS.halftoneSize,
  dotSpacing: params?.dotSpacing ?? DEFAULT_PARAMS.dotSpacing,
  rgbOffset: params?.rgbOffset ?? DEFAULT_PARAMS.rgbOffset,
  rgbOffsetAngle: degToRad(
    params?.rgbOffsetAngle ?? DEFAULT_PARAMS.rgbOffsetAngle
  ),
  effectIntensity: params?.effectIntensity ?? DEFAULT_PARAMS.effectIntensity,
  brightness: params?.brightness ?? DEFAULT_PARAMS.brightness,
  contrast: params?.contrast ?? DEFAULT_PARAMS.contrast,
  patternRotation: degToRad(
    params?.patternRotation ?? DEFAULT_PARAMS.patternRotation
  ),
  zoom: params?.zoom ?? DEFAULT_PARAMS.zoom,
});

const convertPartialParams = (
  next: Partial<HalftoneWebGLParams>
): Partial<WorkerParamPayload> => {
  const result: Partial<WorkerParamPayload> = {};
  if (next.halftoneSize !== undefined) result.halftoneSize = next.halftoneSize;
  if (next.dotSpacing !== undefined) result.dotSpacing = next.dotSpacing;
  if (next.rgbOffset !== undefined) result.rgbOffset = next.rgbOffset;
  if (next.rgbOffsetAngle !== undefined)
    result.rgbOffsetAngle = degToRad(next.rgbOffsetAngle);
  if (next.effectIntensity !== undefined)
    result.effectIntensity = next.effectIntensity;
  if (next.brightness !== undefined) result.brightness = next.brightness;
  if (next.contrast !== undefined) result.contrast = next.contrast;
  if (next.patternRotation !== undefined)
    result.patternRotation = degToRad(next.patternRotation);
  if (next.zoom !== undefined) result.zoom = next.zoom;
  return result;
};

export const CanvasHalftoneWebGL = forwardRef<
  CanvasHalftoneWebGLHandle,
  CanvasHalftoneWebGLProps
>(function CanvasHalftoneWebGL(
  {
    width = 512,
    height = 512,
    imageSrc,
    params,
    className = "",
    style,
    suspendWhenHidden = true,
    imageFit = "cover",
    paddingRatio = 0,
  }: CanvasHalftoneWebGLProps,
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef(false);
  const fallbackRendererRef = useRef<HalftoneRendererCore | null>(null);
  const fallbackReadyRef = useRef(false);
  const lastParamsRef = useRef<WorkerParamPayload>(
    mergeParamsWithDefaults(params)
  );
  const visibilityRef = useRef(suspendWhenHidden ? false : true);
  const devicePixelRatioRef = useRef(1);
  const normalizedPaddingRatio = clampPaddingRatio(paddingRatio);
  const canvasSizeRef = useRef({
    width,
    height,
    padding: resolvePaddingPixels(width, normalizedPaddingRatio),
  });
  const lastImageConfigRef = useRef({
    src: resolveImageSrc(imageSrc),
    fit: imageFit,
  });
  const supportsOffscreen =
    typeof window === "undefined"
      ? true
      : typeof OffscreenCanvas !== "undefined" &&
        typeof HTMLCanvasElement !== "undefined" &&
        "transferControlToOffscreen" in HTMLCanvasElement.prototype;

  const postVisibility = useCallback((isVisible: boolean) => {
    visibilityRef.current = isVisible;
    if (workerRef.current && workerReadyRef.current) {
      workerRef.current.postMessage({
        type: "visibility",
        isVisible,
      });
    }
    if (fallbackRendererRef.current && fallbackReadyRef.current) {
      fallbackRendererRef.current.setVisibility(isVisible);
    }
  }, []);

  const syncParamsToRenderer = useCallback(() => {
    if (workerRef.current && workerReadyRef.current) {
      workerRef.current.postMessage({
        type: "params",
        params: lastParamsRef.current,
      });
    }
    if (fallbackRendererRef.current && fallbackReadyRef.current) {
      fallbackRendererRef.current.updateParams(lastParamsRef.current);
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      updateParams: (next: Partial<HalftoneWebGLParams>) => {
        lastParamsRef.current = {
          ...lastParamsRef.current,
          ...convertPartialParams(next),
        };
        syncParamsToRenderer();
      },
    }),
    [syncParamsToRenderer]
  );

  useEffect(() => {
    lastParamsRef.current = mergeParamsWithDefaults(params);
    syncParamsToRenderer();
  }, [params, syncParamsToRenderer]);

  useEffect(() => {
    if (!supportsOffscreen || typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (workerRef.current) return;

    const worker = new Worker(
      new URL("../workers/halftoneWebgl.worker.ts", import.meta.url),
      { type: "module", name: "halftone-webgl" }
    );
    workerRef.current = worker;
    let offscreen: OffscreenCanvas;
    try {
      offscreen = canvas.transferControlToOffscreen();
    } catch (error) {
      console.error("Failed to transfer canvas to worker", error);
      worker.terminate();
      workerRef.current = null;
      return;
    }

    const devicePixelRatio = clampDevicePixelRatio(
      window.devicePixelRatio ?? 1
    );
    devicePixelRatioRef.current = devicePixelRatio;
    const resolvedImageSrc = resolveImageSrc(lastImageConfigRef.current.src);
    lastImageConfigRef.current = {
      src: resolvedImageSrc,
      fit: lastImageConfigRef.current.fit,
    };
    const {
      width: initialWidth,
      height: initialHeight,
      padding: initialPadding,
    } = canvasSizeRef.current;

    worker.postMessage(
      {
        type: "init",
        canvas: offscreen,
        config: {
          width: initialWidth,
          height: initialHeight,
          dpr: devicePixelRatio,
          imageSrc: resolvedImageSrc,
          fitMode: lastImageConfigRef.current.fit,
          padding: initialPadding,
        },
        params: lastParamsRef.current,
      },
      [offscreen]
    );

    workerReadyRef.current = true;
    syncParamsToRenderer();
    if (!suspendWhenHidden) {
      postVisibility(true);
    } else {
      postVisibility(visibilityRef.current);
    }

    return () => {
      workerReadyRef.current = false;
      worker.postMessage({ type: "dispose" });
      worker.terminate();
      workerRef.current = null;
    };
  }, [
    postVisibility,
    supportsOffscreen,
    suspendWhenHidden,
    syncParamsToRenderer,
  ]);

  useEffect(() => {
    if (supportsOffscreen || typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (fallbackRendererRef.current) return;

    const renderer = new HalftoneRendererCore(canvas);
    fallbackRendererRef.current = renderer;
    const devicePixelRatio = clampDevicePixelRatio(
      window.devicePixelRatio ?? 1
    );
    devicePixelRatioRef.current = devicePixelRatio;
    const resolvedImageSrc = resolveImageSrc(lastImageConfigRef.current.src);
    lastImageConfigRef.current = {
      src: resolvedImageSrc,
      fit: lastImageConfigRef.current.fit,
    };
    const {
      width: initialWidth,
      height: initialHeight,
      padding: initialPadding,
    } = canvasSizeRef.current;

    let cancelled = false;
    renderer
      .init(
        {
          width: initialWidth,
          height: initialHeight,
          dpr: devicePixelRatio,
          imageSrc: resolvedImageSrc,
          fitMode: lastImageConfigRef.current.fit,
          padding: initialPadding,
        },
        lastParamsRef.current
      )
      .then(() => {
        if (cancelled) return;
        fallbackReadyRef.current = true;
        syncParamsToRenderer();
        if (!suspendWhenHidden) {
          postVisibility(true);
        } else {
          postVisibility(visibilityRef.current);
        }
      })
      .catch((error) => {
        console.error("Failed to initialize inline halftone renderer", error);
      });

    return () => {
      cancelled = true;
      fallbackReadyRef.current = false;
      renderer.dispose();
      fallbackRendererRef.current = null;
    };
  }, [
    postVisibility,
    supportsOffscreen,
    suspendWhenHidden,
    syncParamsToRenderer,
  ]);

  useEffect(() => {
    const paddingPx = resolvePaddingPixels(width, normalizedPaddingRatio);
    canvasSizeRef.current = { width, height, padding: paddingPx };
    if (workerRef.current && workerReadyRef.current) {
      workerRef.current.postMessage({
        type: "resize",
        width,
        height,
        dpr: devicePixelRatioRef.current,
        padding: paddingPx,
      });
      return;
    }
    if (fallbackRendererRef.current && fallbackReadyRef.current) {
      fallbackRendererRef.current.resize(
        width,
        height,
        devicePixelRatioRef.current,
        paddingPx
      );
    }
  }, [height, width, normalizedPaddingRatio]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const nextDpr = clampDevicePixelRatio(window.devicePixelRatio ?? 1);
      if (Math.abs(nextDpr - devicePixelRatioRef.current) < 0.01) {
        return;
      }
      devicePixelRatioRef.current = nextDpr;
      const {
        width: currentWidth,
        height: currentHeight,
        padding: currentPadding,
      } = canvasSizeRef.current;
      if (workerRef.current && workerReadyRef.current) {
        workerRef.current.postMessage({
          type: "resize",
          width: currentWidth,
          height: currentHeight,
          dpr: nextDpr,
          padding: currentPadding,
        });
      } else if (fallbackRendererRef.current && fallbackReadyRef.current) {
        fallbackRendererRef.current.resize(
          currentWidth,
          currentHeight,
          nextDpr,
          currentPadding
        );
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const resolvedImageSrc = resolveImageSrc(imageSrc);
    if (
      lastImageConfigRef.current.src === resolvedImageSrc &&
      lastImageConfigRef.current.fit === imageFit
    ) {
      return;
    }
    lastImageConfigRef.current = { src: resolvedImageSrc, fit: imageFit };
    if (workerRef.current && workerReadyRef.current) {
      workerRef.current.postMessage({
        type: "image",
        imageSrc: resolvedImageSrc,
        fitMode: imageFit,
      });
    }
    if (fallbackRendererRef.current && fallbackReadyRef.current) {
      void fallbackRendererRef.current.updateImage(resolvedImageSrc, imageFit);
    }
  }, [imageFit, imageSrc]);

  useEffect(() => {
    if (!suspendWhenHidden) return;
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!("IntersectionObserver" in window)) {
      postVisibility(true);
      return () => {
        postVisibility(false);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const isVisible = entry.isIntersecting || entry.intersectionRatio > 0;
        if (isVisible) {
          postVisibility(true);
          return;
        }
        const bounds = entry.boundingClientRect;
        const viewportHeight = window.innerHeight || 0;
        const buffer = viewportHeight * 0.3;
        const bufferedVisible =
          bounds.top < viewportHeight + buffer && bounds.bottom > -buffer;
        postVisibility(bufferedVisible);
      },
      {
        root: null,
        rootMargin: "30% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75],
      }
    );

    observer.observe(canvas);

    return () => {
      observer.disconnect();
      postVisibility(false);
    };
  }, [postVisibility, suspendWhenHidden]);

  useEffect(() => {
    if (suspendWhenHidden) return;
    return () => {
      postVisibility(false);
    };
  }, [postVisibility, suspendWhenHidden]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        ...style,
      }}
      width={width}
      height={height}
    />
  );
});

CanvasHalftoneWebGL.displayName = "CanvasHalftoneWebGL";
