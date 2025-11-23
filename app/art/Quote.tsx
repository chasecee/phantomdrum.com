import { ReactNode } from "react";
import type { CSSProperties } from "react";
interface QuoteProps {
  text: string;
  logo: ReactNode;
  className?: string;
}

export default function Quote({ text, logo, className }: QuoteProps) {
  return (
    <div
      className={`flex text-center flex-col items-center justify-center ${
        className || ""
      }`}
    >
      <blockquote
        className="text-[8cqw] flex text-center flex-col items-center justify-center max-w-[80cqw] leading-[1.1] text-balance tracking-tight whitespace-pre-line mb-4 font-serif font-bold italic"
        style={
          {
            maskImage: "linear-gradient(to top, black 98%, transparent 100%)",
            maskSize: "100% 100%",
            maskPosition: "50% 0%",
            maskRepeat: "repeat",
          } as CSSProperties
        }
      >
        &quot;{text}&quot;
      </blockquote>
      <div className="max-w-[25cqw] opacity-50">{logo}</div>
    </div>
  );
}
