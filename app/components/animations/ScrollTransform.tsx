"use client";

import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from "react";

export type ScrollOffset = {
  anchor?: number;
  viewport?: number;
};

export type TransformValues = {
  scale?: number;
  scaleY?: number;
  translateYPercent?: number;
};

interface ScrollTransformProps extends HTMLAttributes<HTMLDivElement> {
  anchorRef?: RefObject<HTMLElement | null>;
  start?: ScrollOffset;
  end?: ScrollOffset;
  from?: TransformValues;
  to?: TransformValues;
  transformOrigin?: string;
  willChange?: CSSProperties["willChange"];
  viewportMode?: "dynamic" | "initial" | "none";
  children: ReactNode;
  markers?: boolean;
}

const DEFAULT_START: Required<ScrollOffset> = { anchor: 0, viewport: 0 };
const DEFAULT_END: Required<ScrollOffset> = { anchor: 1, viewport: 0 };

const clamp = (value: number, min = 0, max = 1) =>
  value < min ? min : value > max ? max : value;

const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

const normalizeRange = (
  fromValue: number | undefined,
  toValue: number | undefined,
  fallback: number
) => {
  const start =
    typeof fromValue === "number"
      ? fromValue
      : typeof toValue === "number"
      ? toValue
      : fallback;
  const end = typeof toValue === "number" ? toValue : start;
  return { start, end, enabled: start !== end };
};

export default function ScrollTransform({
  anchorRef,
  start,
  end,
  from,
  to,
  transformOrigin,
  willChange,
  viewportMode = "dynamic",
  className,
  style,
  markers,
  children,
  ...rest
}: ScrollTransformProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const initialViewportRef = useRef<number | null>(null);
  const startAnchor = start?.anchor ?? DEFAULT_START.anchor;
  const startViewport = start?.viewport ?? DEFAULT_START.viewport;
  const endAnchor = end?.anchor ?? DEFAULT_END.anchor;
  const endViewport = end?.viewport ?? DEFAULT_END.viewport;

  const scaleRange = normalizeRange(from?.scale, to?.scale, 1);
  const scaleYRange = normalizeRange(from?.scaleY, to?.scaleY, 1);
  const translateYRange = normalizeRange(
    from?.translateYPercent,
    to?.translateYPercent,
    0
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const createMarkerElement = (
      label: string,
      color: string
    ): HTMLDivElement => {
      const marker = document.createElement("div");
      Object.assign(marker.style, {
        position: "absolute",
        inset: "0 auto auto 0",
        height: 0,
        borderTop: `2px dashed ${color}`,
        pointerEvents: "none",
      });
      const badge = document.createElement("span");
      badge.textContent = label;
      Object.assign(badge.style, {
        position: "absolute",
        right: "1rem",
        top: "-0.75rem",
        padding: "0.15rem 0.35rem",
        fontSize: "0.65rem",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        background: "rgba(0,0,0,0.65)",
        color,
      });
      marker.appendChild(badge);
      return marker;
    };
    const createMarkerOverlay = () => {
      const container = document.createElement("div");
      Object.assign(container.style, {
        position: "fixed",
        inset: "0",
        pointerEvents: "none",
        zIndex: "9999",
      });
      const start = createMarkerElement("start", "#4ade80");
      const end = createMarkerElement("end", "#f87171");
      container.appendChild(start);
      container.appendChild(end);
      document.body.appendChild(container);
      return { container, start, end };
    };
    const markerElements =
      markers && typeof document !== "undefined" ? createMarkerOverlay() : null;

    const computedWillChange =
      willChange ??
      (style?.willChange as CSSProperties["willChange"]) ??
      "transform";
    element.style.willChange = computedWillChange
      ? String(computedWillChange)
      : "";

    const computedTransformOrigin =
      transformOrigin ??
      (style?.transformOrigin as CSSProperties["transformOrigin"]);
    if (
      computedTransformOrigin !== undefined &&
      computedTransformOrigin !== null
    ) {
      element.style.transformOrigin = String(computedTransformOrigin);
    }

    let geometryDirty = true;
    let startBoundary = 0;
    let endBoundary = 1;
    let anchorElement: Element | null = null;

    const usesViewport =
      viewportMode !== "none" && (startViewport !== 0 || endViewport !== 0);

    const resolveViewport = () => {
      if (!usesViewport) return 0;
      if (viewportMode === "initial") {
        if (initialViewportRef.current === null) {
          initialViewportRef.current =
            window.visualViewport?.height ?? window.innerHeight ?? 0;
        }
        return initialViewportRef.current;
      }
      return window.visualViewport?.height ?? window.innerHeight ?? 0;
    };

    const refreshGeometry = () => {
      const targetAnchor = anchorRef?.current ?? element;
      if (!targetAnchor) return false;

      anchorElement = targetAnchor;

      const rect = targetAnchor.getBoundingClientRect();
      const scroll = window.scrollY || window.pageYOffset || 0;
      const viewport = resolveViewport() || 1;
      const anchorTop = rect.top + scroll;
      const anchorHeight = rect.height || 1;

      const startValue = Math.max(
        anchorTop + anchorHeight * startAnchor + viewport * startViewport,
        0
      );

      let endValue =
        anchorTop + anchorHeight * endAnchor + viewport * endViewport;
      if (endValue <= startValue) {
        endValue = startValue + 1;
      }

      startBoundary = startValue;
      endBoundary = endValue;
      geometryDirty = false;
      return true;
    };

    const apply = () => {
      if (geometryDirty && !refreshGeometry()) return;

      const scroll = window.scrollY || window.pageYOffset || 0;
      const effectiveEnd =
        endBoundary <= startBoundary ? startBoundary + 1 : endBoundary;
      const progress = clamp(
        (scroll - startBoundary) / (effectiveEnd - startBoundary)
      );

      const transforms: string[] = [];

      if (translateYRange.enabled) {
        const translateY = lerp(
          translateYRange.start,
          translateYRange.end,
          progress
        );
        transforms.push(`translate3d(0, ${translateY}%, 0)`);
      }

      if (scaleRange.enabled) {
        const scale = lerp(scaleRange.start, scaleRange.end, progress);
        transforms.push(`scale(${scale})`);
      }

      if (scaleYRange.enabled) {
        const scaleY = lerp(scaleYRange.start, scaleYRange.end, progress);
        transforms.push(`scaleY(${scaleY})`);
      }

      element.style.transform =
        transforms.length > 0 ? transforms.join(" ") : "none";
      if (markerElements) {
        const updateMarkerPosition = (
          marker: HTMLDivElement,
          boundary: number
        ) => {
          const position = Math.round(boundary - scroll);
          marker.style.top = `${position}px`;
        };
        updateMarkerPosition(markerElements.start, startBoundary);
        updateMarkerPosition(markerElements.end, endBoundary);
      }
    };

    let ticking = false;
    let raf = 0;

    const requestApply = () => {
      if (ticking) return;
      ticking = true;
      raf = window.requestAnimationFrame(() => {
        ticking = false;
        apply();
      });
    };

    const refreshAndApply = () => {
      geometryDirty = true;
      requestApply();
    };

    refreshGeometry();
    apply();

    window.addEventListener("scroll", requestApply, { passive: true });
    window.addEventListener("resize", refreshAndApply);

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && anchorElement
        ? new ResizeObserver(refreshAndApply)
        : null;

    if (anchorElement) {
      resizeObserver?.observe(anchorElement);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", requestApply);
      window.removeEventListener("resize", refreshAndApply);
      resizeObserver?.disconnect();
      markerElements?.container.remove();
    };
  }, [
    anchorRef,
    endAnchor,
    endViewport,
    viewportMode,
    scaleRange.end,
    scaleRange.enabled,
    scaleRange.start,
    scaleYRange.end,
    scaleYRange.enabled,
    scaleYRange.start,
    startAnchor,
    startViewport,
    style?.transformOrigin,
    style?.willChange,
    transformOrigin,
    translateYRange.end,
    translateYRange.enabled,
    translateYRange.start,
    willChange,
    markers,
  ]);

  return (
    <div ref={elementRef} className={className} style={style} {...rest}>
      {children}
    </div>
  );
}
