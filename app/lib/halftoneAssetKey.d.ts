export const HALFTONE_DIRECTORY: string;
export const HALFTONE_FILENAME_PREFIX: string;

export interface HalftoneConfig {
  dotRadius: number;
  dotSpacing: number;
}

export function normalizeHalftoneValue(value: number): number;
export function buildHalftoneKey(config: HalftoneConfig): string;
export function buildHalftoneFilename(config: HalftoneConfig): string;
export function buildHalftonePublicPath(config: HalftoneConfig): string;


