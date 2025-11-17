export interface HalftoneConfig {
  dotRadius: number;
  dotSpacing: number;
}

export const HALFTONE_DIRECTORY: "halftone";
export const HALFTONE_FILENAME_PREFIX: "halftone";

export function normalizeHalftoneValue(value: number): number;
export function buildHalftoneKey(config: HalftoneConfig): string;
export function buildHalftoneFilename(config: HalftoneConfig): string;
export function buildHalftonePublicPath(config: HalftoneConfig): string;

