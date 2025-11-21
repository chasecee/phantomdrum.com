import type { CSSProperties } from "react";
import { generateLayerColors } from "@/app/lib/colorUtils";

const NUM_LAYERS = 10;

const BASE_COLORS = ["#a85a90", "#c82a2a", "#c84a2d", "#e67e22", "#f1c40f"];

const FIRST_LAYER_COLOR: string | null = "#fff";

const OPACITY_RANGE: [number, number] = [1.0, 0.15];

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

const LAYERS = Array.from({ length: NUM_LAYERS }, (_, i) => ({
  id: i,
  colorVar: `--layer-color-${i}`,
  offsetX: `${(i - 0.5) * OFFSET_X_MULTIPLIER}cqi`,
  offsetY: `${(i - 0.5) * OFFSET_Y_MULTIPLIER}cqh`,
  layerHeight: `${(i + 1) * 15}cqh`,
}));

export default function HeroLogoText() {
  const colorVars = LAYER_COLORS.reduce((acc, color, i) => {
    acc[`--layer-color-${i}`] = color;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div
      className="mt-[40svh] aspect-2/1 w-full relative brightness-[200%] contrast-120% border-2 border-blue-500"
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
          maskSize: "1000px 500px",
          maskPosition: "50% 0%",
          maskRepeat: "repeat",
        }}
      >
        <div className="relative pb-2 h-[200cqh] text-[9cqw] tracking-[0.05em] scale-y-[.95] -skew-y-[.5deg] origin-[50%_50%] text-center  leading-[0.8] font-bold">
          {LAYERS.map((layer) => (
            <div
              key={layer.id}
              className="sticky top-[30svh] h-(--layer-height) whitespace-nowrap mix-blend-plus-darker"
              style={{
                color: `var(${layer.colorVar})`,
                transform: `translate(${layer.offsetX}, ${layer.offsetY}) scaleY(1.25)`,
                zIndex: NUM_LAYERS - layer.id,
              }}
            >
              PHANTOM DRUM
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
