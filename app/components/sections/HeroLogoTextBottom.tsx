import type { CSSProperties } from "react";
import { generateLayerColors } from "@/app/lib/colorUtils";
import HalftoneEffect from "../content/HalftoneEffect";
const NUM_LAYERS = 9;

const BASE_COLORS = ["#fdB960", "#ff9932", "#ff8832"];

const FIRST_LAYER_COLOR: string | null = "#ffffff";

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
  FIRST_LAYER_COLOR
);

const OFFSET_X_MULTIPLIER = 0.02;
const OFFSET_Y_MULTIPLIER = 0.02;

const ANIMATION_STAGGER_DELAY = 0.25;
const ANIMATION_DURATION = 1;

const LAYERS = Array.from({ length: NUM_LAYERS }, (_, i) => ({
  id: i,
  colorVar: `--layer-color-${i}`,
  offsetX: `${(i - 0.5) * OFFSET_X_MULTIPLIER}cqi`,
  offsetY: `${(i - 0.5) * OFFSET_Y_MULTIPLIER}cqh`,
  scaleOffset: `${1 + (i + 0.5) * 0.03}`,
  layerHeight: `${(i + 1) * 12}cqh`,
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
      className="aspect-2/1 mb-[10cqw] z-10  brightness-125 w-full relative contrast-150"
      style={
        {
          containerType: "size",
          "--layer-height": LAYERS[0].layerHeight,
          ...colorVars,
        } as CSSProperties
      }
    >
      <HalftoneEffect
        dotRadius={{ base: 1.5, md: 2 }}
        dotSpacing={{ base: 3.5, md: 5 }}
        shape="octagon"
        className="HERO_BACKGROUND pointer-events-none"
      >
        <div className="relative pb-[5cqh] h-[120cqh] text-[10cqw] tracking-[0.15em] scale-y-[.8] skew-y-[.25deg]  origin-[50%_10%] text-center  leading-[0.8] font-bold">
          {LAYERS.map((layer) => (
            <div
              key={layer.id}
              className="sticky top-[100vw] h-(--layer-height) w-[90%] mx-auto whitespace-nowrap "
              style={
                {
                  color: `var(${layer.colorVar})`,
                  "--offset-x": layer.offsetX,
                  "--offset-y": layer.offsetY,
                  transform: `translate(${layer.offsetX}, ${layer.offsetY}) scaleY(${layer.scaleOffset})`,
                  zIndex: NUM_LAYERS - layer.id,
                  opacity: 1,
                  // animation: `${layer.animationName} ${layer.animationDuration} ${layer.animationTimingFunction} ${layer.animationDelay} forwards`,
                } as CSSProperties
              }
            >
              INITIALIZE
            </div>
          ))}
        </div>
      </HalftoneEffect>
    </div>
  );
}
