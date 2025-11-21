import type { CSSProperties } from "react";
import { generateLayerColors } from "@/app/lib/colorUtils";

const NUM_LAYERS = 10;

const BASE_COLORS = ["#a85a90", "#c82a2a", "#c84a2d", "#e67e22", "#f1c40f"];

const FIRST_LAYER_COLOR: string | null = "#fff";

const OPACITY_RANGE: [number, number] = [1, 0.1];

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

const OFFSET_X_MULTIPLIER = 0.05;
const OFFSET_Y_MULTIPLIER = 0.86;

const ANIMATION_STAGGER_DELAY = 0.25;
const ANIMATION_DURATION = 1;

const LAYERS = Array.from({ length: NUM_LAYERS }, (_, i) => ({
  id: i,
  colorVar: `--layer-color-${i}`,
  offsetX: `${(i - 0.5) * OFFSET_X_MULTIPLIER}cqi`,
  offsetY: `${(i - 0.5) * OFFSET_Y_MULTIPLIER}cqh`,
  layerHeight: `${(i + 1) * 17}cqh`,
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
      className="mt-[40svh] aspect-2/1 w-full relative brightness-150 contrast-150"
      style={
        {
          containerType: "size",
          "--layer-height": LAYERS[0].layerHeight,
          ...colorVars,
        } as CSSProperties
      }
    >
      <div
        style={{
          maskImage: "url('/warped-halftone/halftone-hero.webp')",
          maskSize:
            "calc(min(100%, var(--container-width))) calc(min(100%, var(--container-width)) * 0.5)",
          maskPosition: "50% 0%",
          maskRepeat: "repeat",
        }}
      >
        <div className="relative pb-2 h-[200cqh] text-[10cqw] tracking-[-0.025em] scale-y-[.95] -skew-y-[.5deg] origin-[50%_50%] text-center  leading-[0.8] font-bold">
          {LAYERS.map((layer) => (
            <div
              key={layer.id}
              className="sticky top-[40svh] h-(--layer-height) w-[90%] mx-auto whitespace-nowrap mix-blend-plus-darker"
              style={
                {
                  color: `var(${layer.colorVar})`,
                  "--offset-x": layer.offsetX,
                  "--offset-y": layer.offsetY,
                  transform: `translate(${layer.offsetX}, ${layer.offsetY}) scaleY(1.2)`,
                  zIndex: NUM_LAYERS - layer.id,
                  opacity: 0,
                  animation: `${layer.animationName} ${layer.animationDuration} ${layer.animationTimingFunction} ${layer.animationDelay} forwards`,
                } as CSSProperties
              }
            >
              PHANTOM DRUM
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
