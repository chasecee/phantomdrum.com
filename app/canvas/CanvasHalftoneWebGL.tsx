"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";

export type HalftoneWebGLParams = {
  halftoneSize: number;
  dotSpacing: number;
  rgbOffset: number;
  effectIntensity: number;
  brightness: number;
  contrast: number;
};

export type CanvasHalftoneWebGLProps = {
  width?: number;
  height?: number;
  imageSrc: string;
  params?: Partial<HalftoneWebGLParams>;
  className?: string;
  style?: React.CSSProperties;
};

export type CanvasHalftoneWebGLHandle = {
  updateParams: (params: Partial<HalftoneWebGLParams>) => void;
};

const DEFAULT_PARAMS: HalftoneWebGLParams = {
  halftoneSize: 6,
  dotSpacing: 16,
  rgbOffset: 0.8,
  effectIntensity: 1,
  brightness: 1,
  contrast: 1,
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
  }: CanvasHalftoneWebGLProps,
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef(false);
  const lastParamsRef = useRef<HalftoneWebGLParams>({
    ...DEFAULT_PARAMS,
    ...params,
  });
  const visibilityRef = useRef(false);
  const [isWorkerSupported, setIsWorkerSupported] = useState(true);

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
          ...next,
        };
        syncParamsToWorker();
      },
    }),
    [syncParamsToWorker]
  );

  useEffect(() => {
    lastParamsRef.current = {
      ...DEFAULT_PARAMS,
      ...params,
    };
    syncParamsToWorker();
  }, [params, syncParamsToWorker]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (workerRef.current) return;

    if (typeof OffscreenCanvas === "undefined") {
      setIsWorkerSupported(false);
      return;
    }

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
      setIsWorkerSupported(false);
      return;
    }

    const devicePixelRatio = Math.min(window.devicePixelRatio ?? 1, 1.5);
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
        },
        params: lastParamsRef.current,
      },
      [offscreen]
    );

    workerReadyRef.current = true;
    syncParamsToWorker();
    postVisibility(visibilityRef.current);

    const handleResize = () => {
      if (!workerRef.current) return;
      const nextDpr = Math.min(window.devicePixelRatio ?? 1, 1.5);
      workerRef.current.postMessage({
        type: "resize",
        width,
        height,
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
  }, [imageSrc, width, height, postVisibility, syncParamsToWorker]);

  useEffect(() => {
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
        const isVisible =
          entry.isIntersecting || entry.intersectionRatio > 0;
        if (isVisible) {
          postVisibility(true);
          return;
        }
        const bounds = entry.boundingClientRect;
        const viewportHeight = window.innerHeight || 0;
        const buffer = viewportHeight * 0.3;
        const bufferedVisible =
          bounds.top < viewportHeight + buffer &&
          bounds.bottom > -buffer;
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
  }, [postVisibility]);

  if (!isWorkerSupported) {
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

