interface ScaleTextProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ScaleText({
  children,
  className = "",
  style,
}: ScaleTextProps) {
  const chars = children.split("");
  const calculatedFontSize = `${
    Math.round((((100 / chars.length) * 100) / 65) * 100) / 100
  }cqi`;

  const { fontSize, ...containerStyle } = style || {};

  return (
    <div
      className={`scale-text-container w-full ${className}`}
      style={{
        containerType: "inline-size",
        lineHeight: 1,
        ...containerStyle,
      }}
    >
      <div
        className="scale-text flex flex-row justify-between"
        style={{
          fontSize: fontSize || calculatedFontSize,
        }}
      >
        {chars.map((char, i) => (
          <span key={i}>{char === " " ? "\u00A0" : char}</span>
        ))}
      </div>
    </div>
  );
}
