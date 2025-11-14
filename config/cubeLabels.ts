import rawConfig from "./cube-labels.json";

export interface CubeLabel {
  text: string;
  slug: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const cubeLabelFontPath = rawConfig.fontPath;
export const cubeLabelFontSize = rawConfig.fontSize;

export const cubeLabels: CubeLabel[] = rawConfig.cubeLabels.map(
  (text: string) => ({
    text,
    slug: slugify(text),
  })
);

export const cubeLabelSlugify = (text: string) => slugify(text);

export const cubeLabelSlugMap = new Map<string, string>(
  cubeLabels.map((label) => [label.text, label.slug])
);

export default cubeLabels;
