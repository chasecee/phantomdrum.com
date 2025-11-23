/**
 * Auto-generated from config/cube-labels.ts
 * Do not edit directly—edit cube-labels.ts and rerun generate-cube-labels.
 */
export const sentencePacks = [
  {
    "id": "default",
    "title": "Default Recipe",
    "lists": [
      [
        "MEGA",
        "HUGE",
        "FAT",
        "COLOSSAL",
        "IMMENSE",
        "GIGA"
      ],
      [
        "JUICY",
        "CRUNCHY",
        "BUTTERY",
        "SAVORY"
      ],
      [
        "BEAT",
        "DRUM<br/>RIDDEN",
        "LOOPY",
        "SYNTH<br/>LED",
        "SAMPLE<br/>HEAVY"
      ],
      [
        "SOUP",
        "STEW",
        "SALAD",
        "JAM",
        "HANGS",
        "VIBES",
        "NOISE",
        "FRIENDS"
      ]
    ]
  }
] as const;

export type SentencePack = typeof sentencePacks[number];

export default sentencePacks;
