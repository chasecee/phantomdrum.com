const EMBED_DPR_MIN = 1;
const EMBED_DPR_MAX = 3;

const clampEmbedDpr = (value: number) =>
  Math.min(Math.max(value, EMBED_DPR_MIN), EMBED_DPR_MAX);

const parseEmbedDpr = (value: string | null): number | null => {
  if (value === null) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return clampEmbedDpr(parsed);
};

export const getEmbedDprOverride = (): number | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const fromBody = parseEmbedDpr(document.body.dataset.embedDpr ?? null);
  if (fromBody !== null) {
    return fromBody;
  }
  const fromSearch = parseEmbedDpr(
    new URLSearchParams(window.location.search).get("dpr")
  );
  if (fromSearch !== null) {
    return fromSearch;
  }
  return null;
};

export const resolveSceneDpr = (defaultMaxDpr: number): number => {
  if (typeof window === "undefined") {
    return EMBED_DPR_MIN;
  }
  const override = getEmbedDprOverride();
  if (override !== null) {
    return override;
  }
  const current = window.devicePixelRatio ?? EMBED_DPR_MIN;
  return Math.min(current, defaultMaxDpr);
};
