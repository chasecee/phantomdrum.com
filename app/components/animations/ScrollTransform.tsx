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
  children: ReactNode;
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
  className,
  style,
  children,
  ...rest
}: ScrollTransformProps) {
  const elementRef = useRef<HTMLDivElement>(null);
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

    const apply = () => {
      const anchor = anchorRef?.current ?? element;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const scroll = window.scrollY || window.pageYOffset || 0;
      const viewport = window.innerHeight || 1;

      const startBoundary = Math.max(
        rect.top +
          scroll +
          rect.height * startAnchor +
          viewport * startViewport,
        0
      );
      const endBoundary =
        rect.top + scroll + rect.height * endAnchor + viewport * endViewport;

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

    apply();

    window.addEventListener("scroll", requestApply, { passive: true });
    window.addEventListener("resize", requestApply);

    const anchor = anchorRef?.current ?? element;
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && anchor
        ? new ResizeObserver(requestApply)
        : null;

    if (anchor) {
      resizeObserver?.observe(anchor);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", requestApply);
      window.removeEventListener("resize", requestApply);
      resizeObserver?.disconnect();
    };
  }, [
    anchorRef,
    endAnchor,
    endViewport,
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
  ]);

  return (
    <div ref={elementRef} className={className} style={style} {...rest}>
      {children}
    </div>
  );
}
