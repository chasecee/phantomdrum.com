import type { CSSProperties, ReactNode } from "react";

type ScaledTextProps = {
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
  scaleMultiplier?: number;
  style?: CSSProperties;
  wrapperStyle?: CSSProperties;
};

const MIN_SCALE = 0.25;
const MAX_SCALE = 8;
const MIN_SIZE_REM = 1.25;
const MAX_SIZE_REM = 12;
const FLUID_CONTAINER_CQW = 8;
const BASE_TEXT_CLASS = "block leading-[0.95] tracking-tight";
const BASE_WRAPPER_CLASS = "flex w-full";

export default function ScaledText({
  children,
  className = "",
  wrapperClassName = "",
  scaleMultiplier = 1,
  style,
  wrapperStyle,
}: ScaledTextProps) {
  const normalizedScale = clampScale(scaleMultiplier);
  const mergedWrapperClassName =
    `${BASE_WRAPPER_CLASS} ${wrapperClassName}`.trim();
  const mergedTextClassName = `${BASE_TEXT_CLASS} ${className}`.trim();
  const mergedWrapperStyle: CSSProperties = {
    width: "100%",
    alignItems: "center",
    containerType: "inline-size",
    ...wrapperStyle,
  };
  const mergedTextStyle: CSSProperties = {
    ...style,
    fontSize: buildFontSize(normalizedScale),
  };

  return (
    <div className={mergedWrapperClassName} style={mergedWrapperStyle}>
      <span className={mergedTextClassName} style={mergedTextStyle}>
        {children}
      </span>
    </div>
  );
}

function clampScale(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);
}

function buildFontSize(multiplier: number) {
  const min = (MIN_SIZE_REM * multiplier).toFixed(3);
  const max = (MAX_SIZE_REM * multiplier).toFixed(3);
  const fluid = (FLUID_CONTAINER_CQW * multiplier).toFixed(3);
  return `clamp(${min}rem, ${fluid}cqw, ${max}rem)`;
}
