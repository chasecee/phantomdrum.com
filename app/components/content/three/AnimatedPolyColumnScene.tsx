"use client";

import {
  useRef,
  useEffect,
  useState,
  RefObject,
  useMemo,
  useCallback,
} from "react";
import { getScrollTrigger } from "@/app/lib/gsap";
import type { Rotation } from "./types";

export interface AnimatedPolyColumnProps {
  texts: string[];
  trigger: RefObject<HTMLElement>;
  start: string;
  end: string;
  scrub?: number | boolean;
  from?: {
    rotation?: { x?: number; y?: number; z?: number };
    scale?: number;
    yPercent?: number;
  };
  to?: {
    rotation?: { x?: number; y?: number; z?: number };
    scale?: number;
    yPercent?: number;
  };
  showMarkers?: boolean;
  invalidateOnRefresh?: boolean;
  radius?: number;
  height?: number;
  bodyColor?: string;
  edgeColor?: string;
  textSize?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  className?: string;
  strokeWidth?: number;
  labelRotation?: number;
  fitVertical?: boolean;
  verticalPadding?: number;
}

type PolyColumnWorkerConfig = {
  texts: string[];
  radius: number;
  height: number;
  bodyColor: string;
  edgeColor: string;
  textSize: number;
  strokeWidth: number;
  labelRotation: number;
  fitVertical: boolean;
  verticalPadding: number;
  cameraPosition: [number, number, number];
  cameraFov: number;
};

export function AnimatedPolyColumnScene({
  texts,
  trigger,
  start,
  end,
  scrub = 1,
  from,
  to,
  showMarkers = false,
  invalidateOnRefresh = true,
  radius,
  height,
  bodyColor,
  edgeColor,
  textSize = 0.45,
  cameraPosition = [0, 0, 12],
  cameraFov = 18,
  className,
  strokeWidth = 5,
  labelRotation: incomingLabelRotation = Math.PI / 2,
  fitVertical = true,
  verticalPadding = 0.06,
}: AnimatedPolyColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerInitializedRef = useRef(false);
  const transferredCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerConfigRef = useRef<PolyColumnWorkerConfig | null>(null);
  const dprRef = useRef<number>(1);
  const [dynamicRadius, setDynamicRadius] = useState(() => radius ?? 1);
  const [dynamicHeight, setDynamicHeight] = useState(() => height ?? 2.2);
  const targetRotationRef = useRef<Rotation>({
    x: from?.rotation?.x ?? 0,
    y: from?.rotation?.y ?? 0,
    z: from?.rotation?.z ?? 0,
  });
  const targetScaleRef = useRef<number>(from?.scale ?? 1);
  const targetYPercentRef = useRef<number>(from?.yPercent ?? 0);
  const dragRotationRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragStartRotationRef = useRef(0);
  const isHorizontalDragRef = useRef(false);

  const finalRadius = radius ?? dynamicRadius;
  const finalHeight = height ?? dynamicHeight;
  const finalBodyColor = bodyColor ?? "#0E0E0E";
  const finalEdgeColor = edgeColor ?? "#C4A070";
  const initialTranslateY = from?.yPercent ?? 0;

  const faceTexts = useMemo(() => texts, [texts]);

  const workerConfig = useMemo<PolyColumnWorkerConfig>(
    () => ({
      texts: faceTexts,
      radius: finalRadius,
      height: finalHeight,
      bodyColor: finalBodyColor,
      edgeColor: finalEdgeColor,
      textSize,
      strokeWidth,
      labelRotation: incomingLabelRotation,
      fitVertical,
      verticalPadding,
      cameraPosition,
      cameraFov,
    }),
    [
      faceTexts,
      finalRadius,
      finalHeight,
      finalBodyColor,
      finalEdgeColor,
      textSize,
      strokeWidth,
      incomingLabelRotation,
      fitVertical,
      verticalPadding,
      cameraPosition,
      cameraFov,
    ]
  );

  const sendTargetsRef = useRef<(() => void) | null>(null);
  sendTargetsRef.current = () => {
    const worker = workerRef.current;
    if (!worker || !workerInitializedRef.current) return;
    worker.postMessage({
      type: "targets",
      rotation: {
        x: targetRotationRef.current.x,
        y: targetRotationRef.current.y,
        z: targetRotationRef.current.z,
      },
      scale: targetScaleRef.current,
      drag: dragRotationRef.current,
    });
  };

  const throttledSendTargetsRef = useRef<number | null>(null);
  const throttledSendTargets = useCallback(() => {
    if (throttledSendTargetsRef.current !== null) return;
    throttledSendTargetsRef.current = requestAnimationFrame(() => {
      sendTargetsRef.current?.();
      throttledSendTargetsRef.current = null;
    });
  }, []);

  useEffect(() => {
    workerConfigRef.current = workerConfig;
  }, [workerConfig]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.transform = `translateY(${targetYPercentRef.current}%)`;
  }, []);

  useEffect(() => {
    targetRotationRef.current = {
      x: from?.rotation?.x ?? 0,
      y: from?.rotation?.y ?? 0,
      z: from?.rotation?.z ?? 0,
    };
    targetScaleRef.current = from?.scale ?? 1;
    targetYPercentRef.current = from?.yPercent ?? 0;
    dragRotationRef.current = 0;
    if (containerRef.current) {
      containerRef.current.style.transform = `translateY(${targetYPercentRef.current}%)`;
    }
    sendTargetsRef.current?.();
  }, [
    from?.rotation?.x,
    from?.rotation?.y,
    from?.rotation?.z,
    from?.scale,
    from?.yPercent,
  ]);

  useEffect(() => {
    if (radius !== undefined || height !== undefined) {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    }
  }, [radius, height]);

  useEffect(() => {
    if (radius !== undefined && height !== undefined) {
      return;
    }
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const minDim = Math.min(rect.width, rect.height);
      if (radius === undefined) {
        setDynamicRadius(Math.max(minDim * 0.25, 0.6));
      }
      if (height === undefined) {
        setDynamicHeight(Math.max(minDim * 1.4, 2));
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    resizeObserverRef.current = observer;
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      resizeObserverRef.current = null;
    };
  }, [radius, height]);

  useEffect(() => {
    if (!workerInitializedRef.current || !workerRef.current) return;
    workerRef.current.postMessage({
      type: "config",
      config: workerConfig,
    });
    sendTargetsRef.current?.();
  }, [workerConfig]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (transferredCanvasRef.current === canvas) return;
    const config = workerConfigRef.current;
    if (!config) return;

    let initResizeObserver: ResizeObserver | null = null;
    let cleanupFn: (() => void) | null = null;

    const initWorker = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || canvas.clientWidth || 0;
      const height = rect.height || canvas.clientHeight || 0;
      if (width === 0 || height === 0) return;

      if (transferredCanvasRef.current === canvas) return;
      transferredCanvasRef.current = canvas;
      const worker = new Worker(
        new URL("../../../workers/polyColumn.worker.ts", import.meta.url),
        { type: "module" }
      );
      workerRef.current = worker;
      let offscreen: OffscreenCanvas;
      try {
        offscreen = canvas.transferControlToOffscreen();
      } catch {
        transferredCanvasRef.current = null;
        worker.terminate();
        workerRef.current = null;
        return;
      }
      dprRef.current = Math.min(window.devicePixelRatio ?? 1, 1.5);
      worker.postMessage(
        {
          type: "init",
          canvas: offscreen,
          config,
          dimensions: { width, height, dpr: dprRef.current },
        },
        [offscreen]
      );
      workerInitializedRef.current = true;
      sendTargetsRef.current?.();
      let resizeTimeout: number | null = null;
      const handleResize = () => {
        if (resizeTimeout !== null) return;
        resizeTimeout = requestAnimationFrame(() => {
          if (!workerRef.current) {
            resizeTimeout = null;
            return;
          }
          const nextWidth = canvas.clientWidth || 1;
          const nextHeight = canvas.clientHeight || 1;
          const currentDpr = Math.min(window.devicePixelRatio ?? 1, 1.5);
          if (currentDpr !== dprRef.current) {
            dprRef.current = currentDpr;
          }
          workerRef.current.postMessage({
            type: "resize",
            width: nextWidth,
            height: nextHeight,
            dpr: dprRef.current,
          });
          resizeTimeout = null;
        });
      };
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(canvas);
      resizeObserverRef.current = resizeObserver;
      window.addEventListener("resize", handleResize, { passive: true });
      cleanupFn = () => {
        window.removeEventListener("resize", handleResize);
        resizeObserver.disconnect();
        if (resizeTimeout !== null) {
          cancelAnimationFrame(resizeTimeout);
        }
      };
    };

    initResizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (
        entry &&
        entry.contentRect.width > 0 &&
        entry.contentRect.height > 0
      ) {
        initWorker();
        initResizeObserver?.disconnect();
      }
    });
    initResizeObserver.observe(canvas);
    initWorker();

    return () => {
      initResizeObserver?.disconnect();
      cleanupFn?.();
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "dispose" });
        workerRef.current.terminate();
        workerRef.current = null;
      }
      workerInitializedRef.current = false;
      transferredCanvasRef.current = null;
      resizeObserverRef.current = null;
      if (throttledSendTargetsRef.current !== null) {
        cancelAnimationFrame(throttledSendTargetsRef.current);
        throttledSendTargetsRef.current = null;
      }
    };
  }, [workerConfig]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !containerRef.current ||
      !trigger?.current
    )
      return;

    let scrollTrigger: ReturnType<
      typeof import("gsap/ScrollTrigger").ScrollTrigger.create
    > | null = null;
    let isActive = true;

    const init = async () => {
      if (!isActive) return;
      const ScrollTrigger = await getScrollTrigger();
      if (!isActive || !containerRef.current || !trigger?.current) return;
      const fromRotation = {
        x: from?.rotation?.x ?? 0,
        y: from?.rotation?.y ?? 0,
        z: from?.rotation?.z ?? 0,
      };
      const toRotation = {
        x: to?.rotation?.x ?? fromRotation.x,
        y: to?.rotation?.y ?? fromRotation.y + Math.PI * 2,
        z: to?.rotation?.z ?? fromRotation.z,
      };
      const fromScale = from?.scale ?? 1;
      const toScale = to?.scale ?? fromScale;
      const fromYPercent = from?.yPercent ?? 0;
      const toYPercent = to?.yPercent ?? fromYPercent;
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      scrollTrigger = ScrollTrigger.create({
        trigger: trigger.current,
        start,
        end,
        scrub: typeof scrub === "number" ? scrub : scrub ? 1 : false,
        invalidateOnRefresh,
        markers: showMarkers,
        onUpdate: (self) => {
          const progress = self.progress;
          targetRotationRef.current.x = lerp(
            fromRotation.x,
            toRotation.x,
            progress
          );
          targetRotationRef.current.y = lerp(
            fromRotation.y,
            toRotation.y,
            progress
          );
          targetRotationRef.current.z = lerp(
            fromRotation.z,
            toRotation.z,
            progress
          );
          targetScaleRef.current = lerp(fromScale, toScale, progress);
          targetYPercentRef.current = lerp(fromYPercent, toYPercent, progress);
          if (containerRef.current) {
            containerRef.current.style.transform = `translateY(${targetYPercentRef.current}%)`;
          }
          throttledSendTargets();
        },
      });
    };

    init();
    return () => {
      isActive = false;
      scrollTrigger?.kill();
    };
  }, [
    trigger,
    start,
    end,
    scrub,
    showMarkers,
    invalidateOnRefresh,
    from,
    to,
    throttledSendTargets,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleStart = (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      dragStartRef.current = { x: clientX, y: clientY };
      dragStartRotationRef.current = dragRotationRef.current;
      isHorizontalDragRef.current = false;
      container.style.cursor = "grabbing";
    };

    const handleMove = (clientX: number) => {
      if (!isDraggingRef.current || !isHorizontalDragRef.current) return;
      const width = container.offsetWidth || 1;
      const rotationDelta =
        ((clientX - dragStartRef.current.x) / width) * Math.PI * 2;
      dragRotationRef.current = dragStartRotationRef.current + rotationDelta;
      throttledSendTargets();
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      isHorizontalDragRef.current = false;
      container.style.cursor = "grab";
    };

    const handleMouseDown = (event: MouseEvent) => {
      handleStart(event.clientX, event.clientY);
      isHorizontalDragRef.current = true;
    };

    const handleMouseMove = (event: MouseEvent) => {
      handleMove(event.clientX);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        handleStart(event.touches[0].clientX, event.touches[0].clientY);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isDraggingRef.current || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - dragStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - dragStartRef.current.y);

      if (!isHorizontalDragRef.current) {
        if (deltaY > deltaX && deltaY > 15) {
          handleEnd();
          return;
        }
        if (deltaX > 5 || (deltaX > deltaY && deltaX > 3)) {
          isHorizontalDragRef.current = true;
          event.preventDefault();
        } else {
          return;
        }
      } else {
        event.preventDefault();
      }

      handleMove(touch.clientX);
    };

    const handleTouchEnd = () => {
      handleEnd();
    };

    container.style.cursor = "grab";
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.style.cursor = "";
    };
  }, [throttledSendTargets]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        transform: `translateY(${initialTranslateY}%)`,
      }}
      role="region"
      aria-label="Animated column"
    >
      <div className="sr-only" aria-live="polite">
        <ul>
          {faceTexts.map((text, index) => (
            <li key={index}>{text}</li>
          ))}
        </ul>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
        aria-hidden="true"
      />
    </div>
  );
}
