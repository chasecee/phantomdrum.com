"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef } from "react";
import type { StaticImageData } from "next/image";
import heroLogo from "@/public/img/optimized/herologo.webp";

type HeroLogoTextMaskProps = {
  imageSrc?: StaticImageData | string;
  imageWidth?: number;
  imageHeight?: number;
  alt?: string;
  minScale?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const HERO_IMAGE_DIMENSIONS = {
  width: 1042,
  height: 600,
};

const HERO_LAYOUT = {
  scrollStackMultiplier: 2,
  scrollRangeRatio: 0.95,
};

const loadImageBitmap = async (src: string, signal?: AbortSignal) => {
  const response = await fetch(src, { signal });
  if (!response.ok) {
    throw new Error(`HeroLogoTextMask: failed to fetch ${src}`);
  }
  const blob = await response.blob();
  return createImageBitmap(blob);
};

export default function HeroLogoTextMask({
  imageSrc = heroLogo,
  imageWidth,
  imageHeight,
  alt = "Phantom Drum",
  minScale = 0.18,
}: HeroLogoTextMaskProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const resizePayloadRef = useRef<{
    width: number;
    devicePixelRatio: number;
  } | null>(null);
  const pendingScaleFrameRef = useRef<number | null>(null);
  const pendingScaleRef = useRef<number | null>(null);
  const scaleRef = useRef(1);
  const dimensionsRef = useRef({ width: 0 });
  const minScaleClamped = clamp(minScale, 0.05, 1);

  const resolvedSource =
    typeof imageSrc === "string" ? imageSrc : imageSrc?.src ?? heroLogo.src;
  const fallbackDimensions =
    typeof imageSrc === "object" && "width" in imageSrc && "height" in imageSrc
      ? { width: imageSrc.width, height: imageSrc.height }
      : HERO_IMAGE_DIMENSIONS;
  const resolvedWidth = imageWidth ?? fallbackDimensions.width;
  const resolvedHeight = imageHeight ?? fallbackDimensions.height;
  const safeWidth = resolvedWidth > 0 ? resolvedWidth : 1;
  const safeHeight = resolvedHeight > 0 ? resolvedHeight : 1;
  const aspectRatio = safeHeight / safeWidth || 1;
  const heightExpression = `${aspectRatio * 100}cqw`;

  const applyScale = useCallback(
    (value: number, options?: { force?: boolean }) => {
      const nextScale = clamp(value, minScaleClamped, 1);
      if (!options?.force && Math.abs(nextScale - scaleRef.current) < 0.001) {
        return;
      }
      scaleRef.current = nextScale;
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "scale", value: nextScale });
      }
    },
    [minScaleClamped]
  );

  const scheduleScale = useCallback(
    (value: number) => {
      pendingScaleRef.current = value;
      if (pendingScaleFrameRef.current !== null) return;
      pendingScaleFrameRef.current = window.requestAnimationFrame(() => {
        pendingScaleFrameRef.current = null;
        const pending = pendingScaleRef.current;
        pendingScaleRef.current = null;
        if (pending === null) return;
        applyScale(pending);
      });
    },
    [applyScale]
  );

  const requestResize = useCallback((width: number) => {
    const worker = workerRef.current;
    if (!worker || width <= 0) return;
    resizePayloadRef.current = {
      width,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
    if (resizeFrameRef.current !== null) return;
    resizeFrameRef.current = window.requestAnimationFrame(() => {
      resizeFrameRef.current = null;
      const payload = resizePayloadRef.current;
      resizePayloadRef.current = null;
      if (!payload || !workerRef.current) return;
      workerRef.current.postMessage({
        type: "resize",
        width: payload.width,
        devicePixelRatio: payload.devicePixelRatio,
      });
      workerRef.current.postMessage({
        type: "scale",
        value: scaleRef.current,
      });
    });
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const worker = new Worker(
      new URL("./workers/heroLogoCanvas.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;
    const offscreen = canvasRef.current.transferControlToOffscreen();
    worker.postMessage(
      {
        type: "init",
        canvas: offscreen,
        aspectRatio,
      },
      [offscreen]
    );

    const abortController = new AbortController();
    let disposed = false;
    loadImageBitmap(resolvedSource, abortController.signal)
      .then((bitmap) => {
        if (disposed) {
          bitmap.close();
          return;
        }
        worker.postMessage({ type: "bitmap", bitmap }, [bitmap]);
      })
      .catch((error) => {
        if ((error as Error).name === "AbortError") return;
        console.error("HeroLogoTextMask image load failed", error);
      });

    if (dimensionsRef.current.width > 0) {
      requestResize(dimensionsRef.current.width);
    }
    applyScale(scaleRef.current, { force: true });

    return () => {
      disposed = true;
      abortController.abort();
      worker.postMessage({ type: "dispose" });
      worker.terminate();
      workerRef.current = null;
    };
  }, [aspectRatio, resolvedSource, applyScale, requestResize]);

  useEffect(() => {
    if (typeof window === "undefined" || !("ResizeObserver" in window)) {
      return;
    }
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;
    const observer = new window.ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry.contentRect.width;
      if (width <= 0) return;
      if (Math.abs(width - dimensionsRef.current.width) < 1) return;
      dimensionsRef.current.width = width;
      requestResize(width);
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [requestResize]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      if (!dimensionsRef.current.width) return;
      requestResize(dimensionsRef.current.width);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [requestResize]);

  const computeScale = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return scaleRef.current;
    const sticky = stickyRef.current;
    const rect = anchor.getBoundingClientRect();
    const stickyRect = sticky?.getBoundingClientRect();
    const baseHeight = stickyRect?.height ?? rect.height;
    const extraFactor = Math.max(HERO_LAYOUT.scrollStackMultiplier - 1, 0.05);
    const scrollRange = baseHeight * extraFactor * HERO_LAYOUT.scrollRangeRatio;
    if (scrollRange <= 0) return scaleRef.current;
    const offset = clamp(-rect.top, 0, scrollRange);
    const progress = offset / scrollRange;
    return 1 - progress * (1 - minScaleClamped);
  }, [minScaleClamped]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => scheduleScale(computeScale());
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [computeScale, scheduleScale]);

  useEffect(() => {
    return () => {
      if (pendingScaleFrameRef.current !== null) {
        cancelAnimationFrame(pendingScaleFrameRef.current);
      }
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={anchorRef}
      className={`relative z-10 w-full h-[clamp(33svh,80vw,55svh)] min-h-[33svh] max-h-[55svh] mb-[max(-20vw,-20svh)] ${
        process.env.NODE_ENV === "development" ? "border-2 border-white/10" : ""
      }`}
      style={
        {
          containerType: "size",
          maskImage: "url('/warped-halftone/halftone-hero.webp')",
          maskSize: "100% 100%",
          maskPosition: "50% 50%",
          maskRepeat: "no-repeat",
        } as CSSProperties
      }
    >
      <div
        className="relative w-full h-[200cqh] max-h-[200cqh]"
        style={
          {
            maskImage: "linear-gradient(to bottom, black 65%, transparent 90%)",
            maskSize: "cover",
            maskPosition: "50% 50%",
            maskRepeat: "no-repeat",
          } as CSSProperties
        }
      >
        <div ref={stickyRef} className="sticky top-0 h-[100cqh] max-h-[100cqh]">
          <div
            ref={canvasWrapperRef}
            className="relative w-full max-w-(--container-width) mx-auto"
            style={
              {
                height: heightExpression,
                maxHeight: "100%",
              } as CSSProperties
            }
          >
            <canvas
              ref={canvasRef}
              className="block h-full w-full"
              aria-hidden="true"
            />
          </div>
          <h1 className="sr-only text-[13.5cqi] leading-[0.8] font-bold text-white">
            {alt}
          </h1>
        </div>
      </div>
    </div>
  );
}
