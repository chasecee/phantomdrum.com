import HalftoneEffect from "../content/HalftoneEffect";
import type { CSSProperties } from "react";

const LAYERS = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  colorVar: `--layer-color-${i}`,
  offset: `${(i - 0.5) * 0.15}cqi`,
  layerHeight: `${(i + 1) * 2}cqi`,
  layerOpacity: `${(10 - i) * 0.1}`,
}));

export default function HeroLogoText() {
  return (
    <div
      className="my-10 aspect-2/1 w-full relative"
      style={
        {
          containerType: "size",
          "--layer-height": LAYERS[0].layerHeight,
        } as CSSProperties
      }
    >
      <HalftoneEffect
        dotRadius={1}
        dotSpacing={2}
        className="HERO_LOGO_TEXT"
        shape="octagon"
        applyToChild
      >
        <div className="relative h-[80cqw] scale-y-[1.3] -skew-y-[1deg] origin-top text-center text-[10cqi] leading-[0.8] font-bold">
          {LAYERS.map((layer) => (
            <div
              key={layer.id}
              className="sticky top-1 h-(--layer-height) mix-blend-color-dodge whitespace-nowrap"
              style={{
                color: `var(${layer.colorVar})`,
                transform: `translateY(${layer.offset})`,
                opacity: `${layer.layerOpacity}`,
              }}
            >
              PHANTOM DRUM
            </div>
          ))}
        </div>
      </HalftoneEffect>
    </div>
  );
}
