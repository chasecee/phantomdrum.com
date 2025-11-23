export const fontPath = "assets/fonts/space-mono-v17-latin-700.ttf";
export const fontSize = 120;

export const cubeLabels = [
  "GHOST GRADE",
  "FARM-FRESH",
  "ABSTRACT YET FAMILIAR",
  "CLASSIC SUNDAY DINNER",
  "BIG OL BEATS",
] as const;

export const sentencePacks = [
  {
    id: "default",
    title: "Default Recipe",
    lists: [
      ["MEGA", "HUGE", "FAT", "COLOSSAL", "IMMENSE", "GIGA"],
      ["JUICY", "CRUNCHY", "BUTTERY", "SAVORY"],
      ["BEAT", "DRUM<br/>RIDDEN", "LOOPY", "SYNTH<br/>LED", "SAMPLE<br/>HEAVY"],
      ["SOUP", "STEW", "SALAD", "JAM", "HANGS", "VIBES", "NOISE", "FRIENDS"],
    ],
  },
] as const;
