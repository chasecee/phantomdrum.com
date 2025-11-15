"use client";

import { useEffect } from "react";

export function PerfTicker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    let rafId: number | null = null;
    const tick = () => {
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return null;
}

