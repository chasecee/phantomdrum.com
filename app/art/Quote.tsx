import { ReactNode } from "react";

interface QuoteProps {
  text: string;
  logo: ReactNode;
  className?: string;
}

export default function Quote({ text, logo, className }: QuoteProps) {
  return (
    <div className={` ${className || ""}`}>
      <blockquote className="text-[6vw] leading-[0.9] tracking-tight mb-4 text-balance">
        &quot;{text}&quot;
      </blockquote>
      <div className="max-w-[300px]">{logo}</div>
    </div>
  );
}
