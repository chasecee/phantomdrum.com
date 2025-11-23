import { sentencePacks } from "./sentencePacks.generated";

export interface CubeLabel {
  text: string;
  slug: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/<br\s*\/?>/gi, "-")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const cubeLabelFontPath = "assets/fonts/space-mono-v17-latin-700.ttf";
export const cubeLabelFontSize = 120;

const flattenedSentenceLabels = sentencePacks.flatMap((pack) =>
  Array.isArray(pack.lists) ? pack.lists.flat() : []
);

const labelPool = Array.from(
  new Set(
    flattenedSentenceLabels.map((entry) =>
      typeof entry === "string" ? entry.trim() : ""
    )
  )
).filter(Boolean);

export const cubeLabels: CubeLabel[] = labelPool.map((text) => ({
  text,
  slug: slugify(text),
}));

export const cubeLabelSlugify = (text: string) => slugify(text);

export const cubeLabelSlugMap = new Map<string, string>(
  cubeLabels.map((label) => [label.text, label.slug])
);

export default cubeLabels;
