"use client";

import { useMemo, useState } from "react";
import sentencePacks from "@/config/sentencePacks.generated";
import { AnimatedSentenceCubeScene } from "../content/three/AnimatedSentenceCubeScene";
import HalftoneEffect from "../content/HalftoneEffect";

const DEFAULT_PACK_ID = "default";

export default function SentenceCubeSection() {
  const defaultPack =
    sentencePacks.find((pack) => pack.id === DEFAULT_PACK_ID) ??
    sentencePacks[0];
  const [lists] = useState<string[][]>(
    () => defaultPack?.lists.map((list) => [...list]) ?? []
  );
  const [cameraFov, setCameraFov] = useState(24.5);
  const [cameraZoom, setCameraZoom] = useState(20);
  const showDevControls = process.env.NODE_ENV !== "production";

  const devControls = useMemo(() => {
    if (!showDevControls) {
      return null;
    }
    return (
      <div className="space-y-4 rounded border border-dashed border-amber-400/40 p-4 text-left text-xs text-white/70">
        <div className="space-y-1">
          <label
            htmlFor="sentence-cube-fov"
            className="uppercase tracking-[0.3em]"
          >
            FOV
          </label>
          <input
            id="sentence-cube-fov"
            type="range"
            min={5}
            max={40}
            step={0.5}
            value={cameraFov}
            onChange={(event) => setCameraFov(Number(event.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="font-mono text-amber-200">{cameraFov.toFixed(1)}</div>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="sentence-cube-zoom"
            className="uppercase tracking-[0.3em]"
          >
            Zoom
          </label>
          <input
            id="sentence-cube-zoom"
            type="range"
            min={10}
            max={120}
            step={1}
            value={cameraZoom}
            onChange={(event) => setCameraZoom(Number(event.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="font-mono text-amber-200">
            {cameraZoom.toFixed(0)}
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.4em] text-white/40">
          Dev Only
        </div>
      </div>
    );
  }, [cameraFov, cameraZoom, showDevControls]);

  if (!lists.length) {
    return null;
  }

  return (
    <section className="relative w-full px-6 py-28 sm:py-32 text-white">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="mx-auto w-full max-w-5xl aspect-3/2 relative">
          <HalftoneEffect
            dotRadius={{ base: 1.5, md: 2 }}
            dotSpacing={{ base: 3.5, md: 4 }}
            shape="octagon"
            className="CUBE_SECTION absolute inset-0"
          >
            <AnimatedSentenceCubeScene
              lists={lists}
              className="w-full h-full border-2 border-red-500"
              size={3.4}
              heightRatio={2.3}
              widthRatio={0.25}
              spacing={0.05}
              cameraPosition={[0, 0, cameraZoom]}
              cameraFov={cameraFov}
              strokeWidth={5}
              fillMode="outline"
              matchTextColor
            />
          </HalftoneEffect>
        </div>
        {showDevControls ? (
          <div className="hidden sm:block">{devControls}</div>
        ) : null}
      </div>
    </section>
  );
}
