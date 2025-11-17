"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type CanvasEffectsProps = {
  width?: number;
  height?: number;
  imageSrc?: string;
  halftoneSize?: number;
  dotSpacing?: number;
  rgbOffsetX?: number;
  rgbOffsetY?: number;
  effectIntensity?: number;
  dotRotation?: number;
  patternRotation?: number;
  dotShape?: "circle" | "square";
  brightness?: number;
  contrast?: number;
};

export type CanvasDynamicParams = Required<
  Pick<
    CanvasEffectsProps,
    | "halftoneSize"
    | "dotSpacing"
    | "rgbOffsetX"
    | "rgbOffsetY"
    | "effectIntensity"
    | "dotRotation"
    | "patternRotation"
    | "dotShape"
  >
>;

export type CanvasEffectsHandle = {
  updateParams: (params: Partial<CanvasDynamicParams>) => void;
};

type WorkerRenderComplete = {
  type: "renderComplete";
  imageData: ImageData;
  requestId: number;
};

type WorkerRenderError = {
  type: "renderError";
  error: string;
  requestId: number | null;
};

type WorkerResponse = WorkerRenderComplete | WorkerRenderError;

const HALFTONE_RENDER_DPR = 0.5;

export const CanvasEffects = forwardRef<
  CanvasEffectsHandle,
  CanvasEffectsProps
>(function CanvasEffects(
  {
    width = 800,
    height = 600,
    imageSrc = "/img/chase.png",
    halftoneSize = 6,
    dotSpacing = 8,
    rgbOffsetX = 5,
    rgbOffsetY = 5,
    effectIntensity = 100,
    dotRotation = 0,
    patternRotation = 30,
    dotShape = "circle",
    brightness = 100,
    contrast = 100,
  }: CanvasEffectsProps,
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const renderContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const dynamicParamsRef = useRef<CanvasDynamicParams>({
    halftoneSize,
    dotSpacing,
    rgbOffsetX,
    rgbOffsetY,
    effectIntensity,
    dotRotation,
    patternRotation,
    dotShape,
  });
  const frameRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const currentWidthRef = useRef<number>(width);
  const currentHeightRef = useRef<number>(height);
  const hasSourceRef = useRef(false);
  const inFlightRequestIdRef = useRef<number | null>(null);
  const requestIdCounterRef = useRef(0);
  const pendingRenderRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      if (!isActive) return;
      setSourceImage(img);
    };
    img.onerror = () => {
      if (!isActive) return;
      setSourceImage(null);
    };
    img.src = imageSrc;

    return () => {
      isActive = false;
    };
  }, [imageSrc]);

  const applyEffects = useCallback(() => {
    const worker = workerRef.current;
    if (!worker || !hasSourceRef.current) return;
    if (inFlightRequestIdRef.current !== null) {
      pendingRenderRef.current = true;
      return;
    }

    const requestId = requestIdCounterRef.current + 1;
    requestIdCounterRef.current = requestId;
    inFlightRequestIdRef.current = requestId;

    worker.postMessage({
      type: "render",
      params: dynamicParamsRef.current,
      requestId,
    });
  }, []);

  const scheduleDraw = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      applyEffects();
    });
  }, [applyEffects]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const worker = new Worker(
      new URL("../workers/halftone.worker.ts", import.meta.url),
      { type: "module", name: "halftone-effects" }
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === "renderComplete") {
        if (inFlightRequestIdRef.current !== event.data.requestId) return;
        const ctx = renderContextRef.current;
        if (!ctx) return;
        ctx.putImageData(event.data.imageData, 0, 0);
        inFlightRequestIdRef.current = null;
        if (pendingRenderRef.current) {
          pendingRenderRef.current = false;
          applyEffects();
        }
      } else if (event.data.type === "renderError") {
        if (
          typeof event.data.requestId === "number" &&
          inFlightRequestIdRef.current === event.data.requestId
        ) {
          inFlightRequestIdRef.current = null;
          if (pendingRenderRef.current) {
            pendingRenderRef.current = false;
            applyEffects();
          }
        }
        console.error("Worker render error:", event.data.error);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      hasSourceRef.current = false;
      inFlightRequestIdRef.current = null;
      pendingRenderRef.current = false;
    };
  }, [applyEffects]);

  const syncSourceToWorker = useCallback(
    (imageData: ImageData) => {
      const worker = workerRef.current;
      if (!worker) return;

      hasSourceRef.current = false;
      inFlightRequestIdRef.current = null;

      const transferable = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );

      worker.postMessage(
        {
          type: "setSource",
          imageData: transferable,
          width: imageData.width,
          height: imageData.height,
        },
        [transferable.data.buffer]
      );

      hasSourceRef.current = true;
      pendingRenderRef.current = true;
      scheduleDraw();
    },
    [scheduleDraw]
  );

  const updateDynamicParams = useCallback(
    (next: Partial<CanvasDynamicParams>) => {
      dynamicParamsRef.current = {
        ...dynamicParamsRef.current,
        ...next,
      };
      scheduleDraw();
    },
    [scheduleDraw]
  );

  useImperativeHandle(
    ref,
    () => ({
      updateParams: updateDynamicParams,
    }),
    [updateDynamicParams]
  );

  useEffect(() => {
    updateDynamicParams({
      halftoneSize,
      dotSpacing,
      rgbOffsetX,
      rgbOffsetY,
      effectIntensity,
      dotRotation,
      patternRotation,
      dotShape,
    });
  }, [
    updateDynamicParams,
    halftoneSize,
    dotSpacing,
    rgbOffsetX,
    rgbOffsetY,
    effectIntensity,
    dotRotation,
    patternRotation,
    dotShape,
  ]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const sourceCanvas = sourceCanvasRef.current;
    if (!canvas || !sourceCanvas) return;

    const ctx = canvas.getContext("2d");
    const sourceCtx = sourceCanvas.getContext("2d");
    if (!ctx || !sourceCtx) return;

    const renderWidth = Math.max(
      1,
      Math.round(width * HALFTONE_RENDER_DPR)
    );
    const renderHeight = Math.max(
      1,
      Math.round(height * HALFTONE_RENDER_DPR)
    );

    renderContextRef.current = ctx;
    currentWidthRef.current = renderWidth;
    currentHeightRef.current = renderHeight;

    canvas.width = renderWidth;
    canvas.height = renderHeight;
    sourceCanvas.width = renderWidth;
    sourceCanvas.height = renderHeight;

    sourceCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    if (sourceImage) {
      const scale = Math.max(
        renderWidth / sourceImage.width,
        renderHeight / sourceImage.height
      );
      const x = (renderWidth - sourceImage.width * scale) / 2;
      const y = (renderHeight - sourceImage.height * scale) / 2;
      sourceCtx.fillStyle = "#000000";
      sourceCtx.fillRect(0, 0, renderWidth, renderHeight);
      sourceCtx.drawImage(
        sourceImage,
        x,
        y,
        sourceImage.width * scale,
        sourceImage.height * scale
      );
    } else {
      const gradient = sourceCtx.createLinearGradient(
        0,
        0,
        renderWidth,
        renderHeight
      );
      gradient.addColorStop(0, "#0f0f0f");
      gradient.addColorStop(1, "#1a1a1a");
      sourceCtx.fillStyle = gradient;
      sourceCtx.fillRect(0, 0, renderWidth, renderHeight);
    }

    sourceCtx.filter = "none";
    const imageData = sourceCtx.getImageData(0, 0, renderWidth, renderHeight);

    syncSourceToWorker(imageData);
  }, [sourceImage, brightness, contrast, width, height, syncSourceToWorker]);

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{
          aspectRatio: `${width} / ${height}`,
        }}
      />
      <canvas ref={sourceCanvasRef} className="hidden" />
    </div>
  );
});

CanvasEffects.displayName = "CanvasEffects";
