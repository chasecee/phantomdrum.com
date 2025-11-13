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
      <blockquote className="text-[6vw] flex text-center flex-col items-center justify-center max-w-[80cqi] leading-[1.1] text-balance tracking-tight whitespace-pre-line mb-4 font-serif font-bold italic">
        &quot;{text}&quot;
      </blockquote>
      <div className="max-w-[25vw] opacity-50">{logo}</div>
    </div>
  );
}
