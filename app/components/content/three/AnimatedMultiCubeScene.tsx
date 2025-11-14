"use client";

import { useRef, useEffect, RefObject, useMemo, useCallback } from "react";
import { getScrollTrigger } from "@/app/lib/gsap";
import type { Rotation } from "./types";

const DEFAULT_COLORS = ["#A85A90", "#C82A2A", "#C84A2D", "#E67E22", "#F1C40F"];
const DEFAULT_TEXT_COLOR = "#C4A070";

type FillMode = "fill" | "outline";

type WorkerConfig = {
  texts: string[];
  size: number;
  heightRatio: number;
  widthRatio: number;
  colors: string[];
  textColor: string;
  textSize: number;
  cameraPosition: [number, number, number];
  cameraFov: number;
  maxWidth: number | null;
  spacing: number;
  fillMode: FillMode;
  strokeWidth: number | null;
  matchTextColor: boolean;
};

export interface AnimatedMultiCubeProps {
  texts: string[];
  trigger: RefObject<HTMLElement>;
  start: string;
  end: string;
  scrub?: number | boolean;
  from?: {
    rotation?: Rotation;
    scale?: number;
  };
  to?: {
    rotation?: Rotation;
    scale?: number;
  };
  showMarkers?: boolean;
  invalidateOnRefresh?: boolean;
  className?: string;
  size?: number;
  heightRatio?: number;
  widthRatio?: number;
  spacing?: number;
  colors?: string[];
  textColor?: string;
  textSize?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  maxWidth?: number | null;
  fillMode?: FillMode;
  strokeWidth?: number | null;
  matchTextColor?: boolean;
  stagger?: boolean;
  staggerDelay?: number;
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function AnimatedMultiCubeScene({
  texts,
  trigger,
  start,
  end,
  scrub = 1,
  from,
  to,
  showMarkers = false,
  invalidateOnRefresh = true,
  className,
  size = 3,
  heightRatio = 0.18,
  widthRatio = 1.1,
  spacing = 0.1,
  colors = DEFAULT_COLORS,
  textColor = DEFAULT_TEXT_COLOR,
  textSize = 0.6,
  cameraPosition = [0, 0, 14],
  cameraFov = 18,
  maxWidth = null,
  fillMode = "fill",
  strokeWidth = null,
  matchTextColor = false,
  stagger = false,
  staggerDelay = 0.12,
}: AnimatedMultiCubeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerInitializedRef = useRef(false);
  const transferredCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerConfigRef = useRef<WorkerConfig | null>(null);
  const targetRotationsRef = useRef<Rotation[]>([]);
  const dragRotationsRef = useRef<number[]>([]);
  const targetScaleRef = useRef<number>(from?.scale ?? 1);
  const dragStartXRef = useRef(0);
  const dragStartRotationsRef = useRef<number[]>([]);
  const draggedCubeIndexRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const dprRef = useRef<number>(1);

  const fromRotationX = useMemo(
    () => from?.rotation?.x ?? 0,
    [from?.rotation?.x]
  );
  const fromRotationY = useMemo(
    () => from?.rotation?.y ?? 0,
    [from?.rotation?.y]
  );
  const fromRotationZ = useMemo(
    () => from?.rotation?.z ?? 0,
    [from?.rotation?.z]
  );
  const toRotationX = useMemo(
    () => to?.rotation?.x ?? fromRotationX,
    [to?.rotation?.x, fromRotationX]
  );
  const toRotationY = useMemo(
    () => to?.rotation?.y ?? fromRotationY + Math.PI * 2,
    [to?.rotation?.y, fromRotationY]
  );
  const toRotationZ = useMemo(
    () => to?.rotation?.z ?? fromRotationZ,
    [to?.rotation?.z, fromRotationZ]
  );
  const fromScale = useMemo(() => from?.scale ?? 1, [from?.scale]);
  const toScale = useMemo(() => to?.scale ?? fromScale, [to?.scale, fromScale]);

  const workerConfig = useMemo<WorkerConfig>(
    () => ({
      texts,
      size,
      heightRatio,
      widthRatio,
      colors,
      textColor,
      textSize,
      cameraPosition,
      cameraFov,
      maxWidth: maxWidth ?? null,
      spacing,
      fillMode,
      strokeWidth: strokeWidth ?? null,
      matchTextColor,
    }),
    [
      texts,
      size,
      heightRatio,
      widthRatio,
      colors,
      textColor,
      textSize,
      cameraPosition,
      cameraFov,
      maxWidth,
      spacing,
      fillMode,
      strokeWidth,
      matchTextColor,
    ]
  );

  const getCubeIndexFromY = useCallback(
    (clientY: number, container: HTMLElement): number | null => {
      const rect = container.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const normalizedY = relativeY / rect.height;
      const cubeHeight = size * heightRatio;
      const spacingUnits = spacing * cubeHeight;
      const totalHeight =
        texts.length * cubeHeight +
        Math.max(texts.length - 1, 0) * spacingUnits;
      const startY = totalHeight / 2 - cubeHeight / 2;
      const worldY = (1 - normalizedY) * totalHeight - totalHeight / 2;
      for (let i = 0; i < texts.length; i++) {
        const cubeY = startY - i * (cubeHeight + spacingUnits);
        const halfHeight = cubeHeight / 2;
        if (worldY >= cubeY - halfHeight && worldY <= cubeY + halfHeight) {
          return i;
        }
      }
      return null;
    },
    [texts.length, size, heightRatio, spacing]
  );

  const sendTargetsRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    sendTargetsRef.current = () => {
      const worker = workerRef.current;
      if (!worker || !workerInitializedRef.current) return;
      const rotationsPayload = targetRotationsRef.current.map((rotation) => ({
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
      }));
      const dragPayload =
        dragRotationsRef.current.length === rotationsPayload.length
          ? dragRotationsRef.current.slice()
          : Array(rotationsPayload.length).fill(0);
      worker.postMessage({
        type: "targets",
        rotations: rotationsPayload,
        dragRotations: dragPayload,
        scale: targetScaleRef.current,
      });
    };
  });

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
    const count = texts.length;
    targetRotationsRef.current = Array.from({ length: count }, () => ({
      x: fromRotationX,
      y: fromRotationY,
      z: fromRotationZ,
    }));
    dragRotationsRef.current = Array(count).fill(0);
    targetScaleRef.current = fromScale;
    sendTargetsRef.current?.();
  }, [texts.length, fromRotationX, fromRotationY, fromRotationZ, fromScale]);

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
    if (!workerConfig) return;

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
        new URL("../../../workers/multiCube.worker.ts", import.meta.url),
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
      dprRef.current = Math.min(window.devicePixelRatio ?? 1, 1.25);
      worker.postMessage(
        {
          type: "init",
          canvas: offscreen,
          config: workerConfig,
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
          const currentDpr = Math.min(window.devicePixelRatio ?? 1, 1.25);
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
    ) {
      return;
    }
    let scrollTrigger: ReturnType<
      typeof import("gsap/ScrollTrigger").ScrollTrigger.create
    > | null = null;
    let active = true;
    const init = async () => {
      if (!active) return;
      const ScrollTrigger = await getScrollTrigger();
      if (!active || !trigger?.current || !containerRef.current) return;
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const staggerOffset = stagger ? Math.max(staggerDelay, 0) : 0;
      const totalCount = texts.length;
      scrollTrigger = ScrollTrigger.create({
        trigger: trigger.current,
        start,
        end,
        scrub: typeof scrub === "number" ? scrub : scrub ? 1 : false,
        invalidateOnRefresh,
        markers: showMarkers,
        onUpdate: (self) => {
          const progress = self.progress;
          targetScaleRef.current = lerp(fromScale, toScale, progress);
          for (let index = 0; index < totalCount; index += 1) {
            let offsetProgress: number;
            if (stagger) {
              const startProgress = index * staggerOffset;
              const endProgress = 1.0;
              const progressRange = endProgress - startProgress;
              if (progressRange > 0) {
                offsetProgress = clamp01(
                  (progress - startProgress) / progressRange
                );
              } else {
                offsetProgress = progress >= startProgress ? 1.0 : 0.0;
              }
            } else {
              offsetProgress = progress;
            }
            const rotation = targetRotationsRef.current[index];
            if (!rotation) {
              targetRotationsRef.current[index] = {
                x: lerp(fromRotationX, toRotationX, offsetProgress),
                y: lerp(fromRotationY, toRotationY, offsetProgress),
                z: lerp(fromRotationZ, toRotationZ, offsetProgress),
              };
            } else {
              rotation.x = lerp(fromRotationX, toRotationX, offsetProgress);
              rotation.y = lerp(fromRotationY, toRotationY, offsetProgress);
              rotation.z = lerp(fromRotationZ, toRotationZ, offsetProgress);
            }
          }
          throttledSendTargets();
        },
      });
    };
    init();
    return () => {
      active = false;
      scrollTrigger?.kill();
    };
  }, [
    trigger,
    start,
    end,
    scrub,
    showMarkers,
    invalidateOnRefresh,
    fromRotationX,
    fromRotationY,
    fromRotationZ,
    toRotationX,
    toRotationY,
    toRotationZ,
    fromScale,
    toScale,
    texts.length,
    stagger,
    staggerDelay,
    throttledSendTargets,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleStart = (clientX: number, clientY: number) => {
      const cubeIndex = getCubeIndexFromY(clientY, container);
      if (cubeIndex === null) return;
      isDraggingRef.current = true;
      draggedCubeIndexRef.current = cubeIndex;
      dragStartXRef.current = clientX;
      if (dragRotationsRef.current.length !== texts.length) {
        dragRotationsRef.current = Array(texts.length).fill(0);
      }
      dragStartRotationsRef.current = dragRotationsRef.current.slice();
      container.style.cursor = "grabbing";
    };
    const handleMove = (clientX: number) => {
      if (!isDraggingRef.current || draggedCubeIndexRef.current === null)
        return;
      const width = container.offsetWidth || 1;
      const delta = ((clientX - dragStartXRef.current) / width) * Math.PI * 2;
      const cubeIndex = draggedCubeIndexRef.current;
      const startRotation = dragStartRotationsRef.current[cubeIndex] ?? 0;
      dragRotationsRef.current[cubeIndex] = startRotation + delta;
      throttledSendTargets();
    };
    const handleEnd = () => {
      isDraggingRef.current = false;
      draggedCubeIndexRef.current = null;
      container.style.cursor = "grab";
    };
    const handleMouseDown = (event: MouseEvent) => {
      handleStart(event.clientX, event.clientY);
    };
    const handleMouseMove = (event: MouseEvent) => {
      handleMove(event.clientX);
    };
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      handleStart(event.touches[0].clientX, event.touches[0].clientY);
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (!isDraggingRef.current || event.touches.length !== 1) return;
      event.preventDefault();
      handleMove(event.touches[0].clientX);
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
  }, [getCubeIndexFromY, texts.length, throttledSendTargets]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="region"
      aria-label="Animated cubes"
    >
      <div className="sr-only" aria-live="polite">
        <ul>
          {texts.map((text, index) => (
            <li key={`${text}-${index}`}>{text}</li>
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
