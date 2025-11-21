import type { CSSProperties } from "react";
import { generateLayerColors } from "@/app/lib/colorUtils";
import HalftoneEffect from "../content/HalftoneEffect";
const NUM_LAYERS = 20;

const BASE_COLORS = ["#ffff00", "#ff0000", "#0000ff"];

const FIRST_LAYER_COLOR: string | null = null;

const OPACITY_RANGE: [number, number] = [0.1, 0.01];

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

const OFFSET_X_MULTIPLIER = 0.01;
const OFFSET_Y_MULTIPLIER = 0.5;

const ANIMATION_STAGGER_DELAY = 0.15;
const ANIMATION_DURATION = 2.5;

const LAYERS = Array.from({ length: NUM_LAYERS }, (_, i) => ({
  id: i,
  colorVar: `--layer-color-${i}`,
  offsetX: `${(i - 0.5) * OFFSET_X_MULTIPLIER}cqi`,
  offsetY: `${(i - 0.5) * OFFSET_Y_MULTIPLIER}cqh`,
  scaleOffset: `${1 + (i + 0.5) * 5}`,
  layerHeight: `${(i + 1) * 5}cqh`,
  animationName: i === 0 ? "fadeInUp" : "fadeInUp",
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
      className="absolute h-1/2 inset-0 z-1 -translate-y-[30%] w-full  "
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
        dotRadius={1}
        dotSpacing={8}
        shape="octagon"
        className="HERO_BACKGROUND pointer-events-none"
      >
        <div
          className="relative h-[100cqh] text-[80cqw] tracking-[-0.025em]  scale-y-[.75] origin-[50%_50%] text-center  leading-[0.01] font-bold"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 95%, transparent 105%)",
            maskSize: "100% 100%",
            maskPosition: "50% 0%",
            maskRepeat: "repeat",
          }}
        >
          {LAYERS.map((layer) => (
            <div
              key={layer.id}
              className="sticky top-[1svh] h-(--layer-height) mix-blend-screen multiply max-h-[200px]  mx-auto text-center whitespace-nowrap "
              style={
                {
                  color: `var(${layer.colorVar})`,
                  "--offset-x": layer.offsetX,
                  "--offset-y": layer.offsetY,
                  transform: `translate(${layer.offsetX}, ${layer.offsetY}) `,
                  zIndex: NUM_LAYERS - layer.id,
                  opacity: 0,
                  animation: `${layer.animationName} ${layer.animationDuration} ${layer.animationTimingFunction} ${layer.animationDelay} forwards`,
                } as CSSProperties
              }
            >
              <svg
                className="mx-auto"
                width="1em"
                height="1em"
                viewBox="0 0 1 1"
              >
                <circle cx="0.5" cy="0.5" r="0.5" fill="currentColor" />
              </svg>
            </div>
          ))}
        </div>
      </HalftoneEffect>
    </div>
  );
}
