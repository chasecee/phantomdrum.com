import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type JSXElementConstructor,
  type ReactElement,
  type ReactNode,
} from "react";
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
  name?: string;
  applyToChild?: boolean;
}

export default function HalftoneEffect({
  children,
  dotRadius = 2,
  dotSpacing = 5,
  className = "",
  name,
  applyToChild = false,
}: HalftoneEffectProps) {
  const instanceId = name || "halftone";
  const radiusMap = normalizeResponsiveValue(dotRadius);
  const spacingMap = normalizeResponsiveValue(dotSpacing);
  const { attributes, cssRules } = buildMaskDefinitions(radiusMap, spacingMap);
  const sanitizedInstanceId =
    instanceId
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "halftone";
  const instanceClass = `halftone-instance-${sanitizedInstanceId}`;
  const halftoneClassName = buildClassName(
    "halftone-mask",
    instanceClass,
    className
  );

  const targetSelector = `.${instanceClass}.halftone-mask`;
  const allCssText = cssRules
    .map((rule) =>
      rule.cssText.replace(".halftone-mask[", `${targetSelector}[`)
    )
    .join("");

  const styleElement =
    allCssText.length > 0 ? (
      <style
        key={`${instanceId}:${cssRules.map((r) => r.ruleKey).join(",")}`}
        dangerouslySetInnerHTML={{
          __html: allCssText,
        }}
      />
    ) : null;

  const wrapperStyle: CSSProperties = {
    ...MASK_BASE_STYLE,
  };

  const canApplyToChild =
    applyToChild && Children.count(children) === 1 && isValidElement(children);

  if (canApplyToChild) {
    const child = Children.only(children) as ReactElement<
      Record<string, unknown>,
      string | JSXElementConstructor<unknown>
    >;
    const existingStyle = child.props.style as CSSProperties | undefined;
    const mergedStyle: CSSProperties =
      typeof existingStyle === "object" && existingStyle
        ? { ...existingStyle }
        : {};
    // if (!mergedStyle.position) {
    //   mergedStyle.position = "relative";
    // }
    Object.assign(mergedStyle, MASK_BASE_STYLE);
    const childClassName = child.props.className as string | undefined;

    return (
      <>
        {styleElement}
        {cloneElement(child, {
          className: buildClassName(
            "halftone-mask",
            instanceClass,
            childClassName,
            className
          ),
          style: mergedStyle,
          ...attributes,
        })}
      </>
    );
  }

  return (
    <>
      {styleElement}
      <div className={halftoneClassName} style={wrapperStyle} {...attributes}>
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

    if (breakpoint === "base" || key !== lastKey) {
      attributes[attr] = key;
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

function buildCssRule(
  attr: string,
  key: string,
  media: string | undefined
): string {
  const tile = halftoneMap[key as HalftoneMapKey];
  if (!tile) {
    throw new Error(`Missing halftone tile metadata for key "${key}"`);
  }
  const filePath = `/halftone/halftone-${key}.svg`;
  const selector = ".halftone-mask";
  const rule = `${selector}[${attr}="${key}"]{-webkit-mask-image:url("${filePath}");mask-image:url("${filePath}");-webkit-mask-size:${tile.size}px ${tile.size}px;mask-size:${tile.size}px ${tile.size}px;}`;
  return media ? `@media ${media}{${rule}}` : rule;
}

function buildClassName(...values: (string | undefined)[]) {
  return values
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");
}
