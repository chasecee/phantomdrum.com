export type HalftoneShape = "circle" | "square" | "octagon" | "hexagon" | "triangle";

export const HALFTONE_DIRECTORY: string;
export const HALFTONE_FILENAME_PREFIX: string;
export const HALFTONE_SHAPES: ReadonlyArray<HalftoneShape>;

export interface HalftoneConfig {
  dotRadius: number;
  dotSpacing: number;
  shape?: HalftoneShape;
}

export function normalizeHalftoneValue(value: number): number;
export function buildHalftoneKey(config: HalftoneConfig): string;
export function buildHalftoneFilename(config: HalftoneConfig): string;
export function buildHalftonePublicPath(config: HalftoneConfig): string;
export function computeHalftoneTileSize(
  dotSpacing: number,
  shape?: HalftoneShape
): number;


