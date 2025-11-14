export function createDiamondMaskSVG(
  dotRadius: number = 2,
  dotSpacing: number = 6,
  angle: number = 45
): string {
  const patternSize = dotSpacing * 1.414213562;
  const halfPattern = patternSize / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" x="0" y="0" width="${patternSize}" height="${patternSize}" patternUnits="userSpaceOnUse"><circle cx="${halfPattern}" cy="0" r="${dotRadius}" fill="black"/><circle cx="0" cy="${halfPattern}" r="${dotRadius}" fill="black"/><circle cx="${patternSize}" cy="${halfPattern}" r="${dotRadius}" fill="black"/><circle cx="${halfPattern}" cy="${patternSize}" r="${dotRadius}" fill="black"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}


