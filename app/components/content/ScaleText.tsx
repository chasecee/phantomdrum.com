interface ScaleTextProps {
  children: string;
  className?: string;
}

export default function ScaleText({
  children,
  className = "",
}: ScaleTextProps) {
  const chars = children.split("");
  const fontSize = `${Math.round((100 / chars.length) * 100) / 90}cqi`;

  return (
    <div
      className={`scale-text-container ${className}`}
      style={{
        containerType: "inline-size",
        lineHeight: 1,
      }}
    >
      <div
        className="scale-text flex flex-row justify-between"
        style={{
          fontSize,
        }}
      >
        {chars.map((char, i) => (
          <span key={i}>{char === " " ? "\u00A0" : char}</span>
        ))}
      </div>
    </div>
  );
}
