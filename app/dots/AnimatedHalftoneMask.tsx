"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";

export interface AnimatedHalftoneMaskProps {
  imageSrc: string;
  alt?: string;
  containerRef: React.RefObject<HTMLElement | null>;
  startRadius?: number;
  endRadius?: number;
  startSpacing?: number;
  endSpacing?: number;
  scrollStart?: string;
  scrollEnd?: string;
  scrub?: number | boolean;
  showMarkers?: boolean;
  className?: string;
}

const SQRT_TWO = Math.SQRT2;
const MIN_RADIUS = 0.05;
const MIN_SPACING = 0.05;
const PATTERN_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [0.5, 0],
  [0, 0.5],
  [1, 0.5],
  [0.5, 1],
  [0.5, 0.5],
];

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type ImageSource = ImageBitmap | HTMLImageElement | null;

const releaseImageSource = (source: ImageSource) => {
  if (
    source &&
    typeof ImageBitmap !== "undefined" &&
    source instanceof ImageBitmap &&
    typeof source.close === "function"
  ) {
    source.close();
  }
};

const getSourceDimensions = (source: ImageSource) => {
  if (!source) {
    return { width: 0, height: 0 };
  }
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    return { width: source.width, height: source.height };
  }
  return {
    width:
      (source as HTMLImageElement).naturalWidth ||
      (source as HTMLImageElement).width ||
      0,
    height:
      (source as HTMLImageElement).naturalHeight ||
      (source as HTMLImageElement).height ||
      0,
  };
};

export default function AnimatedHalftoneMask({
  imageSrc,
  alt = "",
  containerRef,
  startRadius = 2,
  endRadius = 6,
  startSpacing = 6,
  endSpacing = 18,
  scrollStart = "top bottom",
  scrollEnd = "bottom top",
  scrub = true,
  showMarkers = false,
  className = "",
}: AnimatedHalftoneMaskProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageSourceRef = useRef<ImageSource>(null);
  const rafRef = useRef<number | null>(null);
  const dprRef = useRef(1);
  const targetRadiusRef = useRef(startRadius);
  const targetSpacingRef = useRef(startSpacing);
  const patternCacheRef = useRef<{
    canvas: HTMLCanvasElement;
    radius: number;
    spacing: number;
    size: number;
    dpr: number;
  } | null>(null);

  const ensurePatternCanvas = useCallback((radius: number, spacing: number) => {
    const safeRadius = Math.max(radius, MIN_RADIUS);
    const safeSpacing = Math.max(spacing, MIN_SPACING);
    const size = Math.max(safeSpacing * SQRT_TWO, MIN_SPACING);
    const dpr = dprRef.current;
    let cache = patternCacheRef.current;
    if (!cache) {
      cache = {
        canvas: document.createElement("canvas"),
        radius: -1,
        spacing: -1,
        size: -1,
        dpr: -1,
      };
      patternCacheRef.current = cache;
    }
    const canvas = cache.canvas;
    const pixelSize = Math.max(Math.round(size * dpr), 1);
    const needsResize = cache.size !== size || cache.dpr !== dpr;
    if (needsResize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
      cache.size = size;
      cache.dpr = dpr;
      cache.radius = -1;
      cache.spacing = -1;
    }
    if (
      needsResize ||
      Math.abs(cache.radius - safeRadius) > 0.001 ||
      Math.abs(cache.spacing - safeSpacing) > 0.001
    ) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#fff";
      PATTERN_POSITIONS.forEach(([nx, ny]) => {
        ctx.beginPath();
        ctx.arc(nx * size, ny * size, safeRadius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      cache.radius = safeRadius;
      cache.spacing = safeSpacing;
    }
    return canvas;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const imageSource = imageSourceRef.current;
    if (!canvas || !imageSource) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    if (!width || !height) return;
    const { width: imageWidth, height: imageHeight } =
      getSourceDimensions(imageSource);
    if (!imageWidth || !imageHeight) return;

    const patternCanvas = ensurePatternCanvas(
      targetRadiusRef.current,
      targetSpacingRef.current
    );
    if (!patternCanvas) return;
    const pattern = ctx.createPattern(patternCanvas, "repeat");
    if (!pattern) return;
    if (typeof pattern.setTransform === "function") {
      pattern.setTransform(new DOMMatrix());
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "source-in";
    const scale = Math.max(width / imageWidth, height / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const dx = (width - drawWidth) / 2;
    const dy = (height - drawHeight) / 2;
    ctx.drawImage(imageSource, dx, dy, drawWidth, drawHeight);
    ctx.restore();
  }, [ensurePatternCanvas]);

  const requestDraw = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      draw();
    });
  }, [draw]);

  const resizeCanvas = useCallback(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    const nextWidth = Math.max(Math.round(rect.width * dpr), 1);
    const nextHeight = Math.max(Math.round(rect.height * dpr), 1);
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }
    if (canvas.style.width !== `${rect.width}px`) {
      canvas.style.width = `${rect.width}px`;
    }
    if (canvas.style.height !== `${rect.height}px`) {
      canvas.style.height = `${rect.height}px`;
    }
    if (Math.abs(dprRef.current - dpr) > 0.001) {
      dprRef.current = dpr;
      patternCacheRef.current = null;
    }
    requestDraw();
  }, [requestDraw]);

  const replaceImageSource = useCallback(
    (next: ImageSource) => {
      if (imageSourceRef.current === next) return;
      releaseImageSource(imageSourceRef.current);
      imageSourceRef.current = next;
      requestDraw();
    },
    [requestDraw]
  );

  const updateTargets = useCallback(
    (progress: number) => {
      const clamped = clamp01(progress);
      const nextRadius = lerp(startRadius, endRadius, clamped);
      const nextSpacing = lerp(startSpacing, endSpacing, clamped);
      if (
        Math.abs(nextRadius - targetRadiusRef.current) < 0.001 &&
        Math.abs(nextSpacing - targetSpacingRef.current) < 0.001
      ) {
        return;
      }
      targetRadiusRef.current = nextRadius;
      targetSpacingRef.current = nextSpacing;
      requestDraw();
    },
    [endRadius, endSpacing, requestDraw, startRadius, startSpacing]
  );

  useEffect(() => {
    targetRadiusRef.current = startRadius;
    targetSpacingRef.current = startSpacing;
    requestDraw();
  }, [requestDraw, startRadius, startSpacing]);

  useEffect(() => {
    if (!canvasRef.current) return;
    resizeCanvas();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        resizeCanvas();
      });
      observer.observe(canvasRef.current);
    }
    const handleWindowResize = () => resizeCanvas();
    window.addEventListener("resize", handleWindowResize, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    let cancelled = false;
    let bitmap: ImageBitmap | null = null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = imageSrc;
    img.onload = async () => {
      if (cancelled) return;
      let source: ImageSource = img;
      if (typeof createImageBitmap === "function") {
        try {
          bitmap = await createImageBitmap(img);
          if (cancelled) {
            bitmap.close();
            return;
          }
          source = bitmap;
        } catch {
          source = img;
        }
      }
      replaceImageSource(source);
    };
    img.onerror = () => {
      if (!cancelled) {
        replaceImageSource(null);
      }
    };
    return () => {
      cancelled = true;
      if (bitmap) {
        bitmap.close();
      }
    };
  }, [imageSrc, replaceImageSource]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(
        {},
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: scrollStart,
            end: scrollEnd,
            scrub,
            markers: showMarkers,
            onUpdate: (self: { progress: number }) => {
              updateTargets(self.progress);
            },
            onEnter: () => updateTargets(0),
            onEnterBack: () => updateTargets(0),
            onLeave: () => updateTargets(1),
            onLeaveBack: () => updateTargets(0),
          },
        }
      );
    });
    return () => ctx.revert();
  }, [containerRef, scrollEnd, scrollStart, scrub, showMarkers, updateTargets]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      releaseImageSource(imageSourceRef.current);
    },
    []
  );

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}
