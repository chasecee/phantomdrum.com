interface BackgroundSectionProps {
  position: string;
  overlap?: boolean;
  className?: string;
}

export default function BackgroundSection({
  position,
  overlap = false,
  className,
}: BackgroundSectionProps) {
  return (
    <div
      className={`w-full ${overlap ? "-mt-[10%]" : ""} ${className || ""}`}
      style={{
        ...(overlap && {
          maskImage: "linear-gradient(to bottom, transparent 0%, black 10%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 10%)",
        }),
      }}
    >
      <div
        className="h-full w-full bg-cover scale-[1.1]"
        style={{
          backgroundImage: "url(/img/no-bg.png)",
          backgroundPosition: position.replace("_", " "),
        }}
      />
    </div>
  );
}
