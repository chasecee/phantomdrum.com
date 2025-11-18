import type { CSSProperties } from "react";
import { ReactNode, cloneElement, isValidElement } from "react";
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
  const { attributes, cssText } = buildMaskDefinitions(radiusMap, spacingMap);
  const halftoneClassName = buildClassName("halftone-mask", className);

  const inlineStyleElement =
    cssText.length > 0 ? (
      <style dangerouslySetInnerHTML={{ __html: cssText }} />
    ) : null;

  const content = isValidElement(children)
    ? cloneChild(children, halftoneClassName, attributes)
    : renderWrapper(children, halftoneClassName, attributes);

  if (inlineStyleElement) {
    return (
      <>
        {inlineStyleElement}
        {content}
      </>
    );
  }

  return content;
}

function cloneChild(
  child: React.ReactElement,
  halftoneClassName: string,
  attributes: Record<string, string>
) {
  const childProps = child.props as {
    className?: string;
    style?: CSSProperties;
  };
  return cloneElement(child, {
    className: buildClassName(halftoneClassName, childProps.className),
    style: {
      ...MASK_BASE_STYLE,
      ...(childProps.style ?? {}),
    },
    ...attributes,
  } as Partial<typeof childProps>);
}

function renderWrapper(
  children: ReactNode,
  className: string,
  attributes: Record<string, string>
) {
  return (
    <div className={className} style={MASK_BASE_STYLE} {...attributes}>
      {children}
    </div>
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
  const cssTargets: Array<{ attr: string; key: string; media?: string }> = [];
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
    if (breakpoint === "base" || key !== lastKey) {
      const { attr, media } = BREAKPOINT_META[breakpoint];
      attributes[attr] = key;
      cssTargets.push({ attr, key, media });
      lastKey = key;
    }
  }

  const cssText = buildInlineCss(cssTargets);
  return { attributes, cssText };
}

function buildInlineCss(
  targets: Array<{ attr: string; key: string; media?: string }>
) {
  const rules: string[] = [];

  for (const target of targets) {
    const tile = halftoneMap[target.key as HalftoneMapKey];
    if (!tile) {
      throw new Error(`Missing halftone tile metadata for key "${target.key}"`);
    }
    const filePath = `/halftone/halftone-${target.key}.svg`;
    const baseRule = `.halftone-mask[${target.attr}="${target.key}"]{-webkit-mask-image:url("${filePath}");mask-image:url("${filePath}");-webkit-mask-size:${tile.size}px ${tile.size}px;mask-size:${tile.size}px ${tile.size}px;}`;
    rules.push(target.media ? `@media ${target.media}{${baseRule}}` : baseRule);
  }

  return rules.join("");
}

function buildClassName(...values: (string | undefined)[]) {
  return values
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");
}
