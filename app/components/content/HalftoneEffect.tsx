import type { CSSProperties } from "react";
import { ReactNode } from "react";
import {
  buildHalftoneKey,
  normalizeHalftoneValue,
} from "../../lib/halftoneAssetKey.js";
import { halftoneMap } from "../../generated/halftoneMap";

type Breakpoint = "base" | "sm" | "md" | "lg" | "xl" | "2xl";
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const BREAKPOINT_SEQUENCE: Breakpoint[] = [
  "base",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
];

const BREAKPOINT_META: Record<Breakpoint, { attr: string; media?: string }> = {
  base: { attr: "data-halftone" },
  sm: { attr: "data-halftone-sm", media: "(min-width: 640px)" },
  md: { attr: "data-halftone-md", media: "(min-width: 768px)" },
  lg: { attr: "data-halftone-lg", media: "(min-width: 1024px)" },
  xl: { attr: "data-halftone-xl", media: "(min-width: 1280px)" },
  "2xl": { attr: "data-halftone-2xl", media: "(min-width: 1536px)" },
};

const MASK_BASE_STYLE: CSSProperties = {
  WebkitMaskRepeat: "repeat",
  maskRepeat: "repeat",
  WebkitMaskPosition: "0 0",
  maskPosition: "0 0",
};

type HalftoneMapKey = keyof typeof halftoneMap;

const CSS_REGISTRY = new Set<string>();

export interface HalftoneEffectProps {
  children: ReactNode;
  dotRadius?: ResponsiveValue<number>;
  dotSpacing?: ResponsiveValue<number>;
  className?: string;
}

export default function HalftoneEffect({
  children,
  dotRadius = 2,
  dotSpacing = 5,
  className = "",
}: HalftoneEffectProps) {
  const radiusMap = normalizeResponsiveValue(dotRadius);
  const spacingMap = normalizeResponsiveValue(dotSpacing);
  const { attributes, cssRules } = buildMaskDefinitions(radiusMap, spacingMap);
  const halftoneClassName = buildClassName("halftone-mask", className);

  const allCssText = cssRules
    .map((rule) => {
      if (!CSS_REGISTRY.has(rule.ruleKey)) {
        CSS_REGISTRY.add(rule.ruleKey);
      }
      return rule.cssText;
    })
    .join("");

  const styleElement =
    allCssText.length > 0 ? (
      <style
        key={cssRules.map((r) => r.ruleKey).join(",")}
        dangerouslySetInnerHTML={{
          __html: allCssText,
        }}
      />
    ) : null;

  return (
    <>
      {styleElement}
      <div
        className={halftoneClassName}
        style={MASK_BASE_STYLE}
        {...attributes}
      >
        {children}
      </div>
    </>
  );
}

function normalizeResponsiveValue(
  value: ResponsiveValue<number>
): Record<Breakpoint, number> {
  const input: Partial<Record<Breakpoint, number>> =
    typeof value === "number" ? { base: value } : { ...value };

  let current =
    input.base ??
    BREAKPOINT_SEQUENCE.slice(1).reduce<number | undefined>(
      (acc, key) => acc ?? input[key],
      undefined
    );

  if (current === undefined) {
    throw new Error("HalftoneEffect requires at least one value");
  }

  const resolved: Record<Breakpoint, number> = {} as Record<Breakpoint, number>;
  current = normalizeHalftoneValue(current);
  resolved.base = current;

  for (const key of BREAKPOINT_SEQUENCE.slice(1)) {
    const next = input[key];
    if (typeof next === "number") {
      current = normalizeHalftoneValue(next);
    }
    resolved[key] = current;
  }

  return resolved;
}

function buildMaskDefinitions(
  radiusMap: Record<Breakpoint, number>,
  spacingMap: Record<Breakpoint, number>
) {
  const attributes: Record<string, string> = {};
  const cssRules: Array<{ ruleKey: string; cssText: string }> = [];
  const seenKeys = new Set<string>();
  let lastKey: string | null = null;

  for (const breakpoint of BREAKPOINT_SEQUENCE) {
    const radius = radiusMap[breakpoint];
    const spacing = spacingMap[breakpoint];
    if (spacing < radius) {
      throw new Error(
        `Halftone spacing (${spacing}) must be >= radius (${radius}) for breakpoint "${breakpoint}"`
      );
    }
    const key = buildHalftoneKey({ dotRadius: radius, dotSpacing: spacing });
    const { attr, media } = BREAKPOINT_META[breakpoint];
    attributes[attr] = key;

    if (breakpoint === "base" || key !== lastKey) {
      const ruleKey = `${attr}:${key}`;
      if (!seenKeys.has(ruleKey)) {
        const cssText = buildCssRule(attr, key, media);
        cssRules.push({ ruleKey, cssText });
        seenKeys.add(ruleKey);
      }
      lastKey = key;
    }
  }

  return { attributes, cssRules };
}

function buildCssRule(attr: string, key: string, media?: string): string {
  const tile = halftoneMap[key as HalftoneMapKey];
  if (!tile) {
    throw new Error(`Missing halftone tile metadata for key "${key}"`);
  }
  const filePath = `/halftone/halftone-${key}.svg`;
  const rule = `.halftone-mask[${attr}="${key}"]{-webkit-mask-image:url("${filePath}");mask-image:url("${filePath}");-webkit-mask-size:${tile.size}px ${tile.size}px;mask-size:${tile.size}px ${tile.size}px;}`;
  return media ? `@media ${media}{${rule}}` : rule;
}

function buildClassName(...values: (string | undefined)[]) {
  return values
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");
}
