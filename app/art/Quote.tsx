import { ReactNode } from "react";

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
      <blockquote className="text-[6vw] flex text-center flex-col items-center justify-center max-w-[80cqi] leading-[0.9] tracking-tight mb-4 text-balance font-serif font-bold italic">
        &quot;{text}&quot;
      </blockquote>
      <div className="max-w-[25vw]">{logo}</div>
    </div>
  );
}
