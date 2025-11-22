import type { CSSProperties } from "react";
import { generateLayerColors, hexToRgb, rgbToRgba } from "@/app/lib/colorUtils";
import HalftoneEffect from "../content/HalftoneEffect";
const NUM_LAYERS = 10;

const BASE_COLORS = ["#e67e22", "#c82a2a", "#c84a2d"];

const FIRST_LAYER_COLOR: string | null = "#fff";

const OPACITY_RANGE: [number, number] = [1, 1];

const calculateOpacity = (index: number, total: number): number => {
  const [maxOpacity, minOpacity] = OPACITY_RANGE;
  const t = index / (total - 1);
  return maxOpacity + (minOpacity - maxOpacity) * t;
};

const LAYER_COLORS = generateLayerColors(
  BASE_COLORS,
  NUM_LAYERS,
  calculateOpacity,
  null
).reverse();

if (FIRST_LAYER_COLOR !== null) {
  const lastOpacity = calculateOpacity(NUM_LAYERS - 1, NUM_LAYERS);
  const [r, g, b] = hexToRgb(FIRST_LAYER_COLOR);
  LAYER_COLORS[NUM_LAYERS - 1] = rgbToRgba(r, g, b, lastOpacity);
}

const OFFSET_X_MULTIPLIER = 0.05;
const OFFSET_Y_MULTIPLIER = 0.15;

const ANIMATION_STAGGER_DELAY = 0.25;
const ANIMATION_DURATION = 1;

const LAYERS = Array.from({ length: NUM_LAYERS }, (_, i) => ({
  id: i,
  colorVar: `--layer-color-${i}`,
  offsetX: `${(i - 0.5) * OFFSET_X_MULTIPLIER}cqi`,
  offsetY: `${(i - 0.5) * OFFSET_Y_MULTIPLIER}cqh`,
  scaleOffset: `${1 + (NUM_LAYERS - 1 - i + 0.5) * 0.05}`,
  layerHeight: `${(i + 1) * 14}cqh`,
  animationName: i === 0 ? "flickerIn" : "fadeInUp",
  animationDelay: i === 0 ? "0s" : `${i * ANIMATION_STAGGER_DELAY}s`,
  animationDuration: i === 0 ? ".25s" : `${ANIMATION_DURATION}s`,
  animationFillMode: "both",
  animationTimingFunction: i === 0 ? "steps(10, end)" : "ease-out",
}));

export default function HeroLogoText() {
  const colorVars = LAYER_COLORS.reduce((acc, color, i) => {
    acc[`--layer-color-${i}`] = color;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div
      className="mt-[50svh] aspect-2/1 z-10 w-full -translate-y-[20%] relative contrast-150"
      style={
        {
          containerType: "size",
          "--layer-height": LAYERS[0].layerHeight,
          ...colorVars,
        } as CSSProperties
      }
    >
      {/* <div
        style={{
          maskImage: "url('/warped-halftone/halftone-hero.webp')",
          maskSize: "contain",
          maskPosition: "50% 0%",
          maskRepeat: "repeat",
        }}
      > */}
      <HalftoneEffect
        dotRadius={{ base: 1.5, md: 2 }}
        dotSpacing={{ base: 3.5, md: 5 }}
        shape="octagon"
        className="HERO_BACKGROUND pointer-events-none"
      >
        <div
          className="relative pb-[25cqh] h-[150cqh] text-[10cqw] tracking-[0.05em] scale-[.9] -skew-y-[.5deg] -skew-x-[.5deg] origin-[50%_50%] text-center  leading-[0.8] font-bold"
          // style={{
          //   maskImage: "linear-gradient(to top, black 98%, transparent 100%)",
          //   maskSize: "100% 100%",
          //   maskPosition: "50% 0%",
          //   maskRepeat: "repeat",
          // }}
        >
          {LAYERS.map((layer) => (
            <div
              key={layer.id}
              className="sticky bottom-[50svh] h-(--layer-height) w-[90%] mx-auto whitespace-nowrap "
              style={
                {
                  color: `var(${layer.colorVar})`,
                  "--offset-x": layer.offsetX,
                  "--offset-y": layer.offsetY,
                  transform: `translate(${layer.offsetX}, ${layer.offsetY}) scaleY(${layer.scaleOffset})`,
                  zIndex: layer.id + 1,
                  opacity: 1,
                  // animation: `${layer.animationName} ${layer.animationDuration} ${layer.animationTimingFunction} ${layer.animationDelay} forwards`,
                } as CSSProperties
              }
            >
              PHANTOM DRUM
            </div>
          ))}
        </div>
      </HalftoneEffect>
    </div>
  );
}
