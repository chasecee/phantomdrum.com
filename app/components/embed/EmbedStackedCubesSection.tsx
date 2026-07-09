import HalftoneEffect from "../content/HalftoneEffect";
import { EmbedMultiCubeScene } from "./EmbedMultiCubeScene";

const CUBE_TEXTS = [
  "GHOST GRADE",
  "FARM-FRESH",
  "ABSTRACT YET FAMILIAR",
  "CLASSIC SUNDAY DINNER",
  "BIG OL BEATS",
];

export default function EmbedStackedCubesSection() {
  return (
    <HalftoneEffect
      dotRadius={{ base: 1.5, md: 2 }}
      dotSpacing={{ base: 3.5, md: 5 }}
      shape="octagon"
      className="CUBE_SECTION flex h-dvh w-full items-center justify-center overflow-hidden"
    >
      <div className="relative aspect-square h-full max-h-dvh w-full max-w-dvh overflow-hidden">
        <EmbedMultiCubeScene
          texts={CUBE_TEXTS}
          from={{ rotation: { x: 0.01, y: 0, z: 0 } }}
          to={{ rotation: { x: -0.01, y: -Math.PI * 0.5, z: 0 } }}
          className="absolute inset-0"
          heightRatio={0.2}
          widthRatio={0.95}
          size={3}
          spacing={0.1}
          stagger
          staggerDelay={0.1}
          fillMode="outline"
          strokeWidth={5}
          matchTextColor
        />
      </div>
    </HalftoneEffect>
  );
}
