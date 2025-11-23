"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Rotation } from "./types";

const DEFAULT_COLORS = ["#A85A90", "#C82A2A", "#C84A2D", "#E67E22", "#F1C40F"];
const DEFAULT_TEXT_COLOR = "#C4A070";
const TOUCH_DRAG_THRESHOLD_PX = 18;
const MIN_LIST_LENGTH = 3;
const MAX_LISTS = 4;
const TWO_PI = Math.PI * 2;

type FillMode = "fill" | "outline";

type WorkerColumnConfig = {
  faces: string[];
};

type WorkerConfig = {
  columns: WorkerColumnConfig[];
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

export interface AnimatedSentenceCubeProps {
  lists: string[][];
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
  onSentenceChange?: (words: string[], sentence: string) => void;
}

const normalizeListEntries = (entries: string[]) => {
  const cleaned = entries
    .map((entry) => entry?.trim())
    .filter((entry): entry is string => Boolean(entry));
  if (!cleaned.length) {
    return [];
  }
  while (cleaned.length < MIN_LIST_LENGTH) {
    cleaned.push(...cleaned.slice(0, MIN_LIST_LENGTH - cleaned.length));
  }
  return cleaned;
};

const normalizeLists = (lists: string[][]) =>
  lists
    .slice(0, MAX_LISTS)
    .map((list) => normalizeListEntries(list))
    .filter((list) => list.length >= MIN_LIST_LENGTH);

export function AnimatedSentenceCubeScene({
  lists,
  className,
  size = 3,
  heightRatio = 0.22,
  widthRatio = 1.1,
  spacing = 0.3,
  colors = DEFAULT_COLORS,
  textColor = DEFAULT_TEXT_COLOR,
  textSize = 0.8,
  cameraPosition = [0, 0, 18],
  cameraFov = 18,
  maxWidth = null,
  fillMode = "fill",
  strokeWidth = null,
  matchTextColor = false,
  onSentenceChange,
}: AnimatedSentenceCubeProps) {
  const normalizedLists = useMemo(() => normalizeLists(lists), [lists]);
  const [sentenceWords, setSentenceWords] = useState<string[]>(() =>
    normalizedLists.map((list) => list[0] ?? "")
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerInitializedRef = useRef(false);
  const transferredCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerConfigRef = useRef<WorkerConfig | null>(null);
  const targetRotationsRef = useRef<Rotation[]>([]);
  const dragRotationsRef = useRef<number[]>([]);
  const targetScaleRef = useRef<number>(1);
  const dragStartYRef = useRef(0);
  const dragStartRotationsRef = useRef<number[]>([]);
  const draggedCubeIndexRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
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
  const faceStepRef = useRef<number[]>([]);
  const activeListsRef = useRef<string[][]>(normalizedLists);
  const selectedIndicesRef = useRef<number[]>(normalizedLists.map(() => 0));
  const onSentenceChangeRef = useRef(onSentenceChange);

  useEffect(() => {
    onSentenceChangeRef.current = onSentenceChange;
  }, [onSentenceChange]);

  const publishSentence = useCallback((words: string[]) => {
    const sentence = words.join(" ").replace(/\s+/g, " ").trim();
    onSentenceChangeRef.current?.(words, sentence);
  }, []);

  const updateSentenceFromIndices = useCallback(() => {
    const words = activeListsRef.current.map((list, index) => {
      const selected = selectedIndicesRef.current[index] ?? 0;
      return list[selected] ?? list[0] ?? "";
    });
    setSentenceWords(words);
    publishSentence(words);
  }, [publishSentence]);

  useEffect(() => {
    activeListsRef.current = normalizedLists;
    faceStepRef.current = normalizedLists.map((list) =>
      list.length > 0 ? TWO_PI / list.length : 0
    );
    selectedIndicesRef.current = normalizedLists.map(() => 0);
    updateSentenceFromIndices();
  }, [normalizedLists, updateSentenceFromIndices]);

  const workerConfig = useMemo<WorkerConfig>(
    () => ({
      columns: normalizedLists.map((faces) => ({ faces })),
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
      normalizedLists,
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

  const getCubeIndexFromX = useCallback(
    (clientX: number, container: HTMLElement): number | null => {
      const cubeCount = normalizedLists.length;
      if (!cubeCount) return null;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return null;
      const relativeX = clientX - rect.left;
      const normalizedX = relativeX / rect.width;
      if (normalizedX < 0 || normalizedX > 1) return null;
      const index = Math.floor(normalizedX * cubeCount);
      if (index < 0 || index >= cubeCount) return null;
      return index;
    },
    [normalizedLists.length]
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
  }, []);

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
        const isVisible = entry.isIntersecting || entry.intersectionRatio > 0;
        if (isVisible) {
          updateWorkerVisibility(true);
          return;
        }
        const bounds = entry.boundingClientRect;
        const viewportHeight = window.innerHeight || 0;
        const buffer = viewportHeight * 0.25;
        const bufferedVisible =
          bounds.top < viewportHeight + buffer && bounds.bottom > -buffer;
        updateWorkerVisibility(bufferedVisible);
      },
      {
        root: null,
        rootMargin: "25% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75],
      }
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
    const count = normalizedLists.length;
    targetRotationsRef.current = Array.from({ length: count }, () => ({
      x: 0,
      y: 0,
      z: 0,
    }));
    dragRotationsRef.current = Array(count).fill(0);
    targetScaleRef.current = 1;
    updateSentenceFromIndices();
    sendTargetsRef.current?.();
  }, [normalizedLists.length, updateSentenceFromIndices]);

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

    let initResizeObserver: ResizeObserver | null = null;
    let cleanupFn: (() => void) | null = null;

    const measureCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = canvas.clientWidth || Math.round(rect.width);
      const height = canvas.clientHeight || Math.round(rect.height);
      return {
        width: Number.isFinite(width) ? width : 0,
        height: Number.isFinite(height) ? height : 0,
      };
    };

    const initWorker = () => {
      const { width, height } = measureCanvasSize();
      if (width < 2 || height < 2) return;

      if (transferredCanvasRef.current === canvas) return;
      transferredCanvasRef.current = canvas;
      const worker = new Worker(
        new URL("../../../workers/sentenceCube.worker.ts", import.meta.url),
        { type: "module", name: "sentence-cube-scene" }
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
      const config = workerConfigRef.current ?? workerConfig;
      worker.postMessage(
        {
          type: "init",
          canvas: offscreen,
          config,
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
          if (!workerRef.current) {
            return;
          }
          const { width: measuredWidth, height: measuredHeight } =
            measureCanvasSize();
          if (measuredWidth < 2 || measuredHeight < 2) {
            return;
          }
          const currentDpr = Math.min(window.devicePixelRatio ?? 1, 1.25);
          const previous = canvasDimensionsRef.current;
          const widthChanged = measuredWidth !== previous.width;
          const heightChanged = measuredHeight !== previous.height;
          const dprChanged = Math.abs(currentDpr - previous.dpr) > 0.001;
          if (!widthChanged && !heightChanged && !dprChanged) {
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
      canvasDimensionsRef.current = { width: 0, height: 0, dpr: 1 };
      if (throttledSendTargetsRef.current !== null) {
        cancelAnimationFrame(throttledSendTargetsRef.current);
        throttledSendTargetsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncVisibilityToWorker, throttledSendTargets]);

  const snapToFace = useCallback((index: number) => {
    const faceStep = faceStepRef.current[index];
    const rotation = targetRotationsRef.current[index];
    if (!rotation || !faceStep) return;
    const drag = dragRotationsRef.current[index] ?? 0;
    const rawRotation = rotation.x + drag;
    const snappedSteps = Math.round(rawRotation / faceStep);
    rotation.x = snappedSteps * faceStep;
    dragRotationsRef.current[index] = 0;
    const faceCount = activeListsRef.current[index]?.length ?? 0;
    if (faceCount > 0) {
      const normalizedIndex =
        ((-snappedSteps % faceCount) + faceCount) % faceCount;
      selectedIndicesRef.current[index] = normalizedIndex;
    }
  }, []);

  const finalizeDrag = useCallback(() => {
    if (draggedCubeIndexRef.current === null) {
      return;
    }
    snapToFace(draggedCubeIndexRef.current);
    sendTargetsRef.current?.();
    updateSentenceFromIndices();
    draggedCubeIndexRef.current = null;
  }, [snapToFace, updateSentenceFromIndices]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const beginDrag = (cubeIndex: number, startY: number) => {
      if (isDraggingRef.current) return;
      isDraggingRef.current = true;
      draggedCubeIndexRef.current = cubeIndex;
      dragStartYRef.current = startY;
      if (dragRotationsRef.current.length !== normalizedLists.length) {
        dragRotationsRef.current = Array(normalizedLists.length).fill(0);
      }
      dragStartRotationsRef.current = dragRotationsRef.current.slice();
      container.style.cursor = "grabbing";
    };

    const updateDrag = (clientY: number) => {
      if (!isDraggingRef.current || draggedCubeIndexRef.current === null) {
        return;
      }
      const height = container.offsetHeight || 1;
      const delta = ((clientY - dragStartYRef.current) / height) * TWO_PI;
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
      container.style.cursor = "grab";
      finalizeDrag();
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
      const cubeIndex = getCubeIndexFromX(event.clientX, container);
      if (cubeIndex === null) return;
      beginDrag(cubeIndex, event.clientY);
    };

    const handleMouseMove = (event: MouseEvent) => {
      updateDrag(event.clientY);
    };

    const handleMouseUp = () => {
      endDrag();
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || activeTouchIdRef.current !== null) {
        return;
      }
      const touch = event.touches[0];
      const cubeIndex = getCubeIndexFromX(touch.clientX, container);
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
          Math.abs(deltaY) >= TOUCH_DRAG_THRESHOLD_PX &&
          Math.abs(deltaY) > Math.abs(deltaX)
        ) {
          beginDrag(pending.cubeIndex, touch.clientY);
          pendingTouchDragRef.current = null;
        } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
          resetTouchTracking();
          return;
        } else {
          return;
        }
      }

      event.preventDefault();
      updateDrag(touch.clientY);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const ended = findTouch(event.changedTouches, activeTouchIdRef.current);
      if (!ended) return;
      resetTouchTracking();
      endDrag();
    };

    const handleTouchCancel = (event: TouchEvent) => {
      const cancelled = findTouch(
        event.changedTouches,
        activeTouchIdRef.current
      );
      if (!cancelled) return;
      resetTouchTracking();
      endDrag();
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
  }, [
    finalizeDrag,
    getCubeIndexFromX,
    normalizedLists.length,
    throttledSendTargets,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="region"
      aria-label="Interactive sentence cubes"
    >
      <div className="sr-only" aria-live="polite">
        {sentenceWords.join(" ")}
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
        aria-hidden="true"
      />
    </div>
  );
}
