"use client";

import { useSyncExternalStore } from "react";

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type BreakpointKey = keyof typeof breakpoints;

const ORDER: BreakpointKey[] = ["2xl", "xl", "lg", "md", "sm"];

const getBreakpoint = (): BreakpointKey | null => {
  if (typeof window === "undefined") return null;
  const width = window.innerWidth;
  for (const bp of ORDER) {
    if (width >= breakpoints[bp]) return bp;
  }
  return null;
};

let currentBreakpoint: BreakpointKey | null = null;
const listeners = new Set<() => void>();
let rafId: number | null = null;
let resizeHandler: (() => void) | null = null;

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const handleResize = () => {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    const next = getBreakpoint();
    if (next !== currentBreakpoint) {
      currentBreakpoint = next;
      notifyListeners();
    }
  });
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (listeners.size === 1) {
    currentBreakpoint = getBreakpoint();
    resizeHandler = handleResize;
    window.addEventListener("resize", resizeHandler, { passive: true });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = null;
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };
};

const getSnapshot = () => currentBreakpoint ?? getBreakpoint();

export function useBreakpoint() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getResponsiveValue<T>(
  value: T | Partial<Record<BreakpointKey, T>>,
  currentBreakpoint: BreakpointKey | null
): T {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value as T;
  }

  const responsiveValue = value as Partial<Record<BreakpointKey, T>>;

  if (currentBreakpoint === null) {
    for (let i = ORDER.length - 1; i >= 0; i--) {
      const bp = ORDER[i];
      if (responsiveValue[bp] !== undefined) return responsiveValue[bp] as T;
    }
    return Object.values(responsiveValue)[0] as T;
  }

  const currentIndex = ORDER.indexOf(currentBreakpoint);
  for (let i = currentIndex; i >= 0; i--) {
    const bp = ORDER[i];
    if (responsiveValue[bp] !== undefined) {
      return responsiveValue[bp] as T;
    }
  }

  return Object.values(responsiveValue)[0] as T;
}
