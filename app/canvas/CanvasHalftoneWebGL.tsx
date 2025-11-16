"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";

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
  }: CanvasHalftoneWebGLProps,
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef(false);
  const lastParamsRef = useRef<WorkerParamPayload>(
    mergeParamsWithDefaults(params)
  );
  const visibilityRef = useRef(suspendWhenHidden ? false : true);
  const devicePixelRatioRef = useRef(1);
  const canvasSizeRef = useRef({ width, height });
  const supportsOffscreen =
    typeof window === "undefined"
      ? true
      : typeof OffscreenCanvas !== "undefined";

  const postVisibility = useCallback((isVisible: boolean) => {
    visibilityRef.current = isVisible;
    if (!workerRef.current || !workerReadyRef.current) return;
    workerRef.current.postMessage({
      type: "visibility",
      isVisible,
    });
  }, []);

  const syncParamsToWorker = useCallback(() => {
    if (!workerRef.current || !workerReadyRef.current) return;
    workerRef.current.postMessage({
      type: "params",
      params: lastParamsRef.current,
    });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      updateParams: (next: Partial<HalftoneWebGLParams>) => {
        lastParamsRef.current = {
          ...lastParamsRef.current,
          ...convertPartialParams(next),
        };
        syncParamsToWorker();
      },
    }),
    [syncParamsToWorker]
  );

  useEffect(() => {
    lastParamsRef.current = mergeParamsWithDefaults(params);
    syncParamsToWorker();
  }, [params, syncParamsToWorker]);

  useEffect(() => {
    if (!supportsOffscreen || typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (workerRef.current) return;

    const worker = new Worker(
      new URL("../workers/halftoneWebgl.worker.ts", import.meta.url),
      { type: "module" }
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

    const devicePixelRatio = Math.min(window.devicePixelRatio ?? 1, 1.5);
    devicePixelRatioRef.current = devicePixelRatio;
    let resolvedImageSrc = imageSrc;
    try {
      resolvedImageSrc = new URL(imageSrc, window.location.origin).toString();
    } catch {
      resolvedImageSrc = imageSrc;
    }

    worker.postMessage(
      {
        type: "init",
        canvas: offscreen,
        config: {
          width,
          height,
          dpr: devicePixelRatio,
          imageSrc: resolvedImageSrc,
          fitMode: imageFit,
        },
        params: lastParamsRef.current,
      },
      [offscreen]
    );

    workerReadyRef.current = true;
    syncParamsToWorker();
    if (!suspendWhenHidden) {
      postVisibility(true);
    } else {
      postVisibility(visibilityRef.current);
    }

    const handleResize = () => {
      if (!workerRef.current) return;
      if (typeof window === "undefined") return;
      const nextDpr = Math.min(window.devicePixelRatio ?? 1, 1.5);
      if (Math.abs(nextDpr - devicePixelRatioRef.current) < 0.01) {
        return;
      }
      devicePixelRatioRef.current = nextDpr;
      const { width: currentWidth, height: currentHeight } =
        canvasSizeRef.current;
      workerRef.current.postMessage({
        type: "resize",
        width: currentWidth,
        height: currentHeight,
        dpr: nextDpr,
      });
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      workerReadyRef.current = false;
      worker.postMessage({ type: "dispose" });
      worker.terminate();
      workerRef.current = null;
    };
  }, [
    imageSrc,
    width,
    height,
    imageFit,
    postVisibility,
    syncParamsToWorker,
    supportsOffscreen,
    suspendWhenHidden,
  ]);

  useEffect(() => {
    canvasSizeRef.current = { width, height };
    if (!workerRef.current || !workerReadyRef.current) return;
    workerRef.current.postMessage({
      type: "resize",
      width,
      height,
      dpr: devicePixelRatioRef.current,
    });
  }, [height, width]);

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

  if (!supportsOffscreen) {
    return (
      <div className={className} style={style}>
        <p className="text-red-500 text-sm">
          WebGL halftone preview requires OffscreenCanvas support.
        </p>
      </div>
    );
  }

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
