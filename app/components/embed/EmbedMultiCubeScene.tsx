import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import type { Rotation } from "../content/three/types";

const DEFAULT_COLORS = ["#A85A90", "#C82A2A", "#C84A2D", "#E67E22", "#F1C40F"];
const DEFAULT_TEXT_COLOR = "#C4A070";
const TOUCH_DRAG_THRESHOLD_PX = 18;

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
  blank: boolean;
};

export interface EmbedMultiCubeProps {
  texts: string[];
  autoPlayDuration?: number;
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
  blank?: boolean;
  stagger?: boolean;
  staggerDelay?: number;
  drag?: boolean;
  from?: {
    rotation?: Rotation;
    scale?: number;
  };
  to?: {
    rotation?: Rotation;
    scale?: number;
  };
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const easeInOutSine = (value: number) => -(Math.cos(Math.PI * clamp01(value)) - 1) / 2;

export function EmbedMultiCubeScene({
  texts,
  autoPlayDuration = 8,
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
  blank = false,
  stagger = false,
  staggerDelay = 0.12,
  drag = false,
  from,
  to,
}: EmbedMultiCubeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [canvasKey] = useState(() => Date.now());
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
  const dragContainerWidthRef = useRef<number>(1);
  const pendingTouchDragRef = useRef<{
    cubeIndex: number;
    startX: number;
    startY: number;
  } | null>(null);
  const activeTouchIdRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const dprRef = useRef<number>(1);
  const canvasDimensionsRef = useRef({
    width: 0,
    height: 0,
    dpr: 1,
  });
  const lastVisibilityRef = useRef(false);

  const fromRotationX = from?.rotation?.x ?? 0;
  const fromRotationY = from?.rotation?.y ?? 0;
  const fromRotationZ = from?.rotation?.z ?? 0;
  const toRotationX = to?.rotation?.x ?? fromRotationX;
  const toRotationY = to?.rotation?.y ?? fromRotationY + Math.PI * 2;
  const toRotationZ = to?.rotation?.z ?? fromRotationZ;
  const fromScale = from?.scale ?? 1;
  const toScale = to?.scale ?? fromScale;

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
      blank,
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
      blank,
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

  const syncVisibilityToWorker = useCallback(() => {
    if (!workerRef.current || !workerInitializedRef.current) return;
    workerRef.current.postMessage({
      type: "visibility",
      isVisible: lastVisibilityRef.current,
    });
  }, []);

  const updateWorkerVisibility = useCallback(
    (isVisible: boolean) => {
      if (lastVisibilityRef.current === isVisible) return;
      lastVisibilityRef.current = isVisible;
      syncVisibilityToWorker();
    },
    [syncVisibilityToWorker]
  );

  useEffect(() => {
    workerConfigRef.current = workerConfig;
  }, [workerConfig]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const container = containerRef.current;
    if (!container) return;

    if (!("IntersectionObserver" in window)) {
      updateWorkerVisibility(true);
      return () => {
        if (lastVisibilityRef.current) {
          lastVisibilityRef.current = false;
          syncVisibilityToWorker();
        }
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        updateWorkerVisibility(entry.isIntersecting || entry.intersectionRatio > 0);
      },
      { threshold: [0, 0.25] }
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (lastVisibilityRef.current) {
        lastVisibilityRef.current = false;
        syncVisibilityToWorker();
      }
    };
  }, [updateWorkerVisibility, syncVisibilityToWorker]);

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
    if (!canvas || !workerConfig) return;
    if (transferredCanvasRef.current === canvas) return;

    if (workerRef.current) {
      workerRef.current.postMessage({ type: "dispose" });
      workerRef.current.terminate();
      workerRef.current = null;
      workerInitializedRef.current = false;
    }
    transferredCanvasRef.current = null;

    let initResizeObserver: ResizeObserver | null = null;
    let cleanupFn: (() => void) | null = null;
    let rafId: number | null = null;
    let cancelled = false;

    const measureCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = canvas.clientWidth || Math.round(rect.width);
      const height = canvas.clientHeight || Math.round(rect.height);
      return {
        width: Number.isFinite(width) ? width : 0,
        height: Number.isFinite(height) ? height : 0,
      };
    };

    const startWorker = () => {
      if (cancelled) return;

      const initWorker = () => {
        if (cancelled || transferredCanvasRef.current === canvas) return;

        const { width, height } = measureCanvasSize();
        if (width < 2 || height < 2) return;

        transferredCanvasRef.current = canvas;
        const worker = new Worker(
          new URL("../../workers/embedMultiCube.worker.ts", import.meta.url),
          { type: "module", name: "embed-multi-cube-scene" }
        );
        workerRef.current = worker;

        let offscreen: OffscreenCanvas;
        try {
          if (cancelled) {
            worker.terminate();
            workerRef.current = null;
            transferredCanvasRef.current = null;
            return;
          }
          offscreen = canvas.transferControlToOffscreen();
        } catch (error) {
          console.error("Failed to transfer canvas to offscreen:", error);
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
        canvasDimensionsRef.current = { width, height, dpr: dprRef.current };
        workerInitializedRef.current = true;
        sendTargetsRef.current?.();
        syncVisibilityToWorker();

        let resizeTimeout: number | null = null;
        const handleResize = () => {
          if (resizeTimeout !== null) return;
          resizeTimeout = requestAnimationFrame(() => {
            resizeTimeout = null;
            if (!workerRef.current) return;
            const { width: measuredWidth, height: measuredHeight } =
              measureCanvasSize();
            if (measuredWidth < 2 || measuredHeight < 2) return;
            const currentDpr = Math.min(window.devicePixelRatio ?? 1, 1.25);
            const previous = canvasDimensionsRef.current;
            if (
              measuredWidth === previous.width &&
              measuredHeight === previous.height &&
              Math.abs(currentDpr - previous.dpr) <= 0.001
            ) {
              return;
            }
            dprRef.current = currentDpr;
            canvasDimensionsRef.current = {
              width: measuredWidth,
              height: measuredHeight,
              dpr: dprRef.current,
            };
            workerRef.current.postMessage({
              type: "resize",
              width: measuredWidth,
              height: measuredHeight,
              dpr: dprRef.current,
            });
          });
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(canvas);
        resizeObserverRef.current = resizeObserver;
        window.addEventListener("resize", handleResize, { passive: true });
        cleanupFn = () => {
          window.removeEventListener("resize", handleResize);
          resizeObserver.disconnect();
          if (resizeTimeout !== null) cancelAnimationFrame(resizeTimeout);
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
    };

    rafId = window.requestAnimationFrame(startWorker);

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
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
      canvasDimensionsRef.current = { width: 0, height: 0, dpr: 1 };
      if (throttledSendTargetsRef.current !== null) {
        cancelAnimationFrame(throttledSendTargetsRef.current);
        throttledSendTargetsRef.current = null;
      }
    };
  }, [workerConfig, syncVisibilityToWorker]);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const staggerOffset = stagger ? Math.max(staggerDelay, 0) : 0;
    const totalCount = texts.length;
    const cycleMs = autoPlayDuration * 1000;
    let startTime = performance.now();
    let rafId: number | null = null;
    let active = true;

    const applyProgress = (progress: number) => {
      targetScaleRef.current = lerp(fromScale, toScale, progress);
      for (let index = 0; index < totalCount; index += 1) {
        let offsetProgress: number;
        if (stagger) {
          const startProgress = index * staggerOffset;
          const progressRange = 1 - startProgress;
          offsetProgress =
            progressRange > 0
              ? clamp01((progress - startProgress) / progressRange)
              : progress >= startProgress
                ? 1
                : 0;
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
    };

    const tick = (now: number) => {
      if (!active) return;
      const elapsed = (now - startTime) % (cycleMs * 2);
      const linearProgress =
        elapsed < cycleMs ? elapsed / cycleMs : 1 - (elapsed - cycleMs) / cycleMs;
      applyProgress(easeInOutSine(linearProgress));
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [
    autoPlayDuration,
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
    if (!drag) return;
    const container = containerRef.current;
    if (!container) return;

    const beginDrag = (cubeIndex: number, startX: number) => {
      if (isDraggingRef.current) return;
      isDraggingRef.current = true;
      draggedCubeIndexRef.current = cubeIndex;
      dragStartXRef.current = startX;
      if (dragRotationsRef.current.length !== texts.length) {
        dragRotationsRef.current = Array(texts.length).fill(0);
      }
      dragStartRotationsRef.current = dragRotationsRef.current.slice();
      container.style.cursor = "grabbing";
      dragContainerWidthRef.current = container.offsetWidth || 1;
    };

    const updateDrag = (clientX: number) => {
      if (!isDraggingRef.current || draggedCubeIndexRef.current === null) {
        return;
      }
      const width = dragContainerWidthRef.current || 1;
      const delta = ((clientX - dragStartXRef.current) / width) * Math.PI * 2;
      const cubeIndex = draggedCubeIndexRef.current;
      const startRotation = dragStartRotationsRef.current[cubeIndex] ?? 0;
      dragRotationsRef.current[cubeIndex] = startRotation + delta;
      throttledSendTargets();
    };

    const endDrag = () => {
      if (!isDraggingRef.current) {
        return;
      }
      isDraggingRef.current = false;
      draggedCubeIndexRef.current = null;
      container.style.cursor = "grab";
    };

    const resetTouchTracking = () => {
      pendingTouchDragRef.current = null;
      activeTouchIdRef.current = null;
    };

    const findTouch = (touches: TouchList, id: number | null) => {
      if (id === null) return null;
      for (let index = 0; index < touches.length; index += 1) {
        const touch = touches.item(index);
        if (touch && touch.identifier === id) {
          return touch;
        }
      }
      return null;
    };

    const handleMouseDown = (event: MouseEvent) => {
      const cubeIndex = getCubeIndexFromY(event.clientY, container);
      if (cubeIndex === null) return;
      beginDrag(cubeIndex, event.clientX);
    };

    const handleMouseMove = (event: MouseEvent) => {
      updateDrag(event.clientX);
    };

    const handleMouseUp = () => {
      endDrag();
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || activeTouchIdRef.current !== null) {
        return;
      }
      const touch = event.touches[0];
      const cubeIndex = getCubeIndexFromY(touch.clientY, container);
      if (cubeIndex === null) {
        resetTouchTracking();
        return;
      }
      activeTouchIdRef.current = touch.identifier;
      pendingTouchDragRef.current = {
        cubeIndex,
        startX: touch.clientX,
        startY: touch.clientY,
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = findTouch(event.touches, activeTouchIdRef.current);
      if (!touch) return;

      if (!isDraggingRef.current) {
        const pending = pendingTouchDragRef.current;
        if (!pending) return;
        const deltaX = touch.clientX - pending.startX;
        const deltaY = touch.clientY - pending.startY;
        if (
          Math.abs(deltaX) >= TOUCH_DRAG_THRESHOLD_PX &&
          Math.abs(deltaX) > Math.abs(deltaY)
        ) {
          beginDrag(pending.cubeIndex, touch.clientX);
          pendingTouchDragRef.current = null;
        } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
          resetTouchTracking();
          return;
        } else {
          return;
        }
      }

      event.preventDefault();
      updateDrag(touch.clientX);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const ended = findTouch(event.changedTouches, activeTouchIdRef.current);
      if (!ended) return;
      resetTouchTracking();
      if (isDraggingRef.current) {
        endDrag();
      }
    };

    const handleTouchCancel = (event: TouchEvent) => {
      const cancelled = findTouch(
        event.changedTouches,
        activeTouchIdRef.current
      );
      if (!cancelled) return;
      resetTouchTracking();
      if (isDraggingRef.current) {
        endDrag();
      }
    };

    container.style.cursor = "grab";
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchCancel);
      container.style.cursor = "";
      resetTouchTracking();
      isDraggingRef.current = false;
      draggedCubeIndexRef.current = null;
    };
  }, [drag, getCubeIndexFromY, texts.length, throttledSendTargets]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={drag ? undefined : { pointerEvents: "none" }}
      aria-hidden="true"
    >
      <canvas
        key={canvasKey}
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
