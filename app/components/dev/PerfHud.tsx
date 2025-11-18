"use client";

import { useEffect, useState } from "react";

type PerfStats = {
  fps: number;
  fpsCap: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
  pageWidth: number;
  pageHeight: number;
  pageWeightBytes: number;
  memoryUsedBytes: number;
  memoryLimitBytes: number;
  browser: string;
};

type PerfStatKey = keyof PerfStats;

type BrowserBrand = {
  brand: string;
  version: string;
};

type NavigatorWithUA = Navigator & {
  userAgentData?: {
    brands: BrowserBrand[];
  };
};

type PerformanceMemoryInfo = {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
};

type UserAgentSpecificMemoryResult = {
  bytes: number;
};

type PerformanceWithMemory = Performance & {
  memory?: PerformanceMemoryInfo;
  measureUserAgentSpecificMemory?: () => Promise<UserAgentSpecificMemoryResult>;
};

const INITIAL_STATS: PerfStats = {
  fps: 0,
  fpsCap: 0,
  scrollY: 0,
  viewportWidth: 0,
  viewportHeight: 0,
  pageWidth: 0,
  pageHeight: 0,
  pageWeightBytes: 0,
  memoryUsedBytes: 0,
  memoryLimitBytes: 0,
  browser: "",
};

const DL_CLASSES =
  "grow min-w-1/4 md:w-1/4 border-r border-current/10 last:border-r-0 shrink-1";
const DT_CLASSES =
  "py-1 mb-1 px-3 text-[1vw] leading-[1.5] text-current/40 tracking-[0.1em] bg-current/10 border-b border-current/20";
const DD_CLASSES =
  "px-3 font-bold text-[clamp(1.5vw,1rem,3vw)] leading-[1.5] tabular-nums tracking-tight text-current/80 whitespace-nowrap";
const DD_BROWSER_CLASSES = `${DD_CLASSES} md:max-w-[20vw] w-full overflow-hidden`;

const FLUSH_INTERVAL_MS = 1000;

const formatPx = (value: number) => `${Math.round(value).toLocaleString()}`;
const formatPxPadded = (value: number) =>
  `${Math.round(value).toLocaleString()}`;

const formatWeight = (bytes: number) => {
  if (bytes <= 0) {
    return "0 KB";
  }
  const kilobytes = bytes / 1024;
  const megabytes = kilobytes / 1024;
  if (megabytes >= 1024) {
    return `${(megabytes / 1024).toFixed(2)} GB`;
  }
  if (kilobytes >= 1024) {
    return `${megabytes.toFixed(2)} MB`;
  }
  return `${kilobytes.toFixed(1)} KB`;
};

const readDimensions = () => {
  const doc = document.documentElement;
  return {
    scrollY: window.scrollY,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pageWidth: doc.scrollWidth,
    pageHeight: doc.scrollHeight,
  };
};

const entryBytes = (entry: PerformanceEntry) => {
  const resource = entry as PerformanceResourceTiming;
  if (typeof resource.transferSize === "number" && resource.transferSize > 0) {
    return resource.transferSize;
  }
  if (
    typeof resource.encodedBodySize === "number" &&
    resource.encodedBodySize > 0
  ) {
    return resource.encodedBodySize;
  }
  if (
    typeof resource.decodedBodySize === "number" &&
    resource.decodedBodySize > 0
  ) {
    return resource.decodedBodySize;
  }
  return 0;
};

const sumEntryBytes = (entries: PerformanceEntry[]) =>
  entries.reduce((total, entry) => total + entryBytes(entry), 0);

const readPageWeight = () => {
  if (typeof performance === "undefined") {
    return 0;
  }
  const resourceEntries = performance.getEntriesByType("resource");
  const navigationEntries = performance.getEntriesByType("navigation");
  return sumEntryBytes([...resourceEntries, ...navigationEntries]);
};

const readMemoryUsage = async () => {
  if (typeof performance === "undefined") {
    return null;
  }
  const perf = performance as PerformanceWithMemory;
  if (typeof perf.measureUserAgentSpecificMemory === "function") {
    try {
      const result = await perf.measureUserAgentSpecificMemory();
      if (result && typeof result.bytes === "number") {
        return {
          memoryUsedBytes: result.bytes,
          memoryLimitBytes: perf.memory?.jsHeapSizeLimit ?? 0,
        };
      }
    } catch {}
  }
  if (perf.memory && typeof perf.memory.usedJSHeapSize === "number") {
    return {
      memoryUsedBytes: perf.memory.usedJSHeapSize,
      memoryLimitBytes: perf.memory.jsHeapSizeLimit ?? 0,
    };
  }
  return null;
};

const resolveBrowser = () => {
  if (typeof navigator === "undefined") {
    return "";
  }
  const nav = navigator as NavigatorWithUA;
  const data = nav.userAgentData;
  if (data?.brands?.length) {
    const brands = data.brands.filter(
      (brand: BrowserBrand) => brand.brand.toLowerCase() !== "not a(brand)"
    );
    if (brands.length) {
      return brands
        .map((brand: BrowserBrand) => `${brand.brand} ${brand.version}`)
        .join(" · ");
    }
  }
  return nav.userAgent;
};

const usePerfStats = () => {
  const [stats, setStats] = useState<PerfStats>(INITIAL_STATS);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let destroyed = false;
    let dimsRaf: number | null = null;
    let fpsRaf: number | null = null;
    let frameCount = 0;
    let fpsStartTime = performance.now();
    let totalBytes = readPageWeight();
    let resourceObserver: PerformanceObserver | null = null;
    let bodyObserver: ResizeObserver | null = null;
    let memoryTimer: number | null = null;
    let latestStats: PerfStats = INITIAL_STATS;
    let statsDirty = false;
    let paintTimer: number | null = null;
    let initialPaintDone = false;
    let lastPaintTime = performance.now();

    const flushStats = () => {
      paintTimer = null;
      if (destroyed || !statsDirty) {
        return;
      }
      statsDirty = false;
      lastPaintTime = performance.now();
      setStats(latestStats);
    };

    const schedulePaint = () => {
      if (paintTimer !== null) {
        return;
      }
      const now = performance.now();
      const delay = Math.max(0, FLUSH_INTERVAL_MS - (now - lastPaintTime));
      paintTimer = window.setTimeout(flushStats, delay);
    };

    const commit = (partial: Partial<PerfStats>, immediate = false) => {
      if (destroyed) {
        return;
      }
      const next = { ...latestStats };
      const assignable = next as Record<PerfStatKey, PerfStats[PerfStatKey]>;
      let changed = false;
      (Object.keys(partial) as PerfStatKey[]).forEach((key) => {
        const value = partial[key];
        if (value !== undefined && latestStats[key] !== value) {
          assignable[key] = value;
          changed = true;
        }
      });
      if (!changed) {
        return;
      }
      latestStats = next as PerfStats;
      if (!initialPaintDone) {
        initialPaintDone = true;
        statsDirty = false;
        lastPaintTime = performance.now();
        setStats(latestStats);
        return;
      }
      if (immediate) {
        statsDirty = false;
        setStats(latestStats);
        return;
      }
      statsDirty = true;
      schedulePaint();
    };

    const scheduleDims = () => {
      if (dimsRaf !== null) {
        return;
      }
      dimsRaf = window.requestAnimationFrame(() => {
        dimsRaf = null;
        commit(readDimensions(), true);
      });
    };

    const fpsLoop = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - fpsStartTime;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        commit({ fps, fpsCap: fps });
        frameCount = 0;
        fpsStartTime = now;
      }

      fpsRaf = window.requestAnimationFrame(fpsLoop);
    };

    commit({
      ...readDimensions(),
      browser: resolveBrowser(),
      pageWeightBytes: totalBytes,
    });

    window.addEventListener("scroll", scheduleDims, { passive: true });
    window.addEventListener("resize", scheduleDims);

    if (typeof ResizeObserver !== "undefined" && document.body) {
      bodyObserver = new ResizeObserver(() => scheduleDims());
      bodyObserver.observe(document.body);
    }

    fpsRaf = window.requestAnimationFrame(fpsLoop);

    if ("PerformanceObserver" in window) {
      resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (!entries.length) {
          return;
        }
        totalBytes += sumEntryBytes(entries as PerformanceEntry[]);
        commit({ pageWeightBytes: totalBytes });
      });
      try {
        resourceObserver.observe({ entryTypes: ["resource"] });
      } catch {
        resourceObserver.disconnect();
        resourceObserver = null;
      }
    }

    const startMemoryPolling = async () => {
      const snapshot = await readMemoryUsage();
      if (!snapshot || destroyed) {
        return;
      }
      commit(snapshot);
      memoryTimer = window.setInterval(() => {
        void readMemoryUsage().then((next) => {
          if (next && !destroyed) {
            commit(next);
          }
        });
      }, 2000);
    };

    void startMemoryPolling();

    return () => {
      destroyed = true;
      window.removeEventListener("scroll", scheduleDims);
      window.removeEventListener("resize", scheduleDims);
      if (dimsRaf !== null) {
        cancelAnimationFrame(dimsRaf);
      }
      if (fpsRaf !== null) {
        cancelAnimationFrame(fpsRaf);
      }
      resourceObserver?.disconnect();
      bodyObserver?.disconnect();
      if (memoryTimer !== null) {
        window.clearInterval(memoryTimer);
      }
      if (paintTimer !== null) {
        window.clearTimeout(paintTimer);
      }
    };
  }, []);

  return stats;
};

export function PerfHud() {
  const stats = usePerfStats();
  const scrollRange = Math.max(1, stats.pageHeight - stats.viewportHeight);
  const scrollPercent = Math.min(
    100,
    Math.max(0, (stats.scrollY / scrollRange) * 100)
  );
  const fpsCap = Math.max(stats.fpsCap, stats.fps);
  const fpsRatio = fpsCap ? stats.fps / fpsCap : 0;
  const fpsColor =
    fpsRatio >= 0.9
      ? "text-green-400"
      : fpsRatio >= 0.65
      ? "text-green-500"
      : "text-green-600";
  const fpsLabel = fpsCap
    ? `${stats.fps.toString().padStart(2, "0")}/${fpsCap
        .toString()
        .padStart(2, "0")}`
    : stats.fps.toString().padStart(2, "0");
  const scrollLabel = `${formatPxPadded(stats.scrollY)} · ${Math.round(
    scrollPercent
  )
    .toString()
    .padStart(3, "0")}%`;
  const viewportLabel = `${formatPx(stats.viewportWidth)} × ${formatPx(
    stats.viewportHeight
  )}`;
  const pageLabel = `${formatPx(stats.pageWidth)} × ${formatPx(
    stats.pageHeight
  )}`;
  const payloadLabel = formatWeight(stats.pageWeightBytes);
  const memoryLabel =
    stats.memoryUsedBytes > 0
      ? stats.memoryLimitBytes > 0
        ? `${formatWeight(stats.memoryUsedBytes)} / ${formatWeight(
            stats.memoryLimitBytes
          )}`
        : formatWeight(stats.memoryUsedBytes)
      : "pending";
  const browserLabel = stats.browser || "pending";

  return (
    <div className="sticky bottom-0 z-50 w-full mix-blend-difference">
      <div className="p-5 font-mono uppercase tracking-[0.2em] text-green-600">
        <div className="flex md:flex-nowrap justify-items-stretch justify-stretch overflow-auto flex-row flex-wrap w-full  border border-current/10">
          <dl className={DL_CLASSES}>
            <dt className={DT_CLASSES}>fps</dt>
            <dd className={`${DD_CLASSES} ${fpsColor}`}>{fpsLabel}</dd>
          </dl>
          <dl className={DL_CLASSES}>
            <dt className={DT_CLASSES}>scroll</dt>
            <dd className={DD_CLASSES}>{scrollLabel}</dd>
          </dl>
          <dl className={DL_CLASSES}>
            <dt className={DT_CLASSES}>viewport</dt>
            <dd className={DD_CLASSES}>{viewportLabel}</dd>
          </dl>
          <dl className={DL_CLASSES}>
            <dt className={DT_CLASSES}>page</dt>
            <dd className={DD_CLASSES}>{pageLabel}</dd>
          </dl>
          <dl className={DL_CLASSES}>
            <dt className={DT_CLASSES}>payload</dt>
            <dd className={DD_CLASSES}>{payloadLabel}</dd>
          </dl>
          <dl className={DL_CLASSES}>
            <dt className={DT_CLASSES}>memory</dt>
            <dd className={DD_CLASSES}>{memoryLabel}</dd>
          </dl>
          <dl className={`${DL_CLASSES} `}>
            <dt className={DT_CLASSES}>browser</dt>
            <dd className={DD_BROWSER_CLASSES}>
              <span className="block md:overflow-hidden md:text-ellipsis">
                {browserLabel}
              </span>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
