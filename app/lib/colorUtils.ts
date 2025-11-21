export const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

export const rgbToRgba = (
  r: number,
  g: number,
  b: number,
  alpha: number
): string => {
  const roundedAlpha = Math.round(alpha * 100) / 100;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(
    b
  )}, ${roundedAlpha})`;
};

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const generateColorsWithOpacity = (
  baseColors: string[],
  count: number,
  opacityFn: (index: number, total: number) => number
): string[] => {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const position = i / (count - 1);
    const colorIndex = position * (baseColors.length - 1);
    const colorIdx1 = Math.floor(colorIndex);
    const colorIdx2 = Math.min(Math.ceil(colorIndex), baseColors.length - 1);
    const t = colorIndex - colorIdx1;

    const rgb1 = hexToRgb(baseColors[colorIdx1]);
    const rgb2 = hexToRgb(baseColors[colorIdx2]);
    const rgb = [
      lerp(rgb1[0], rgb2[0], t),
      lerp(rgb1[1], rgb2[1], t),
      lerp(rgb1[2], rgb2[2], t),
    ];
    const opacity = opacityFn(i, count);
    colors.push(rgbToRgba(rgb[0], rgb[1], rgb[2], opacity));
  }
  return colors;
};

export const generateLayerColors = (
  baseColors: string[],
  count: number,
  opacityFn: (index: number, total: number) => number,
  firstLayerColor: string | null = null
): string[] => {
  const colors = generateColorsWithOpacity(baseColors, count, opacityFn);

  if (firstLayerColor !== null) {
    const firstOpacity = opacityFn(0, count);
    const [r, g, b] = hexToRgb(firstLayerColor);
    colors[0] = rgbToRgba(r, g, b, firstOpacity);
  }

  return colors;
};
