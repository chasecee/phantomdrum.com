"use client";

interface SmallQuoteProps {
  text: string;
  metaText?: string;
  metaLink?: string;
  className?: string;
}

export default function SmallQuote({
  text,
  metaText,
  metaLink,
  className,
}: SmallQuoteProps) {
  return (
    <div
      className={`flex items-center justify-between gap-1 flex-col text-center ${
        className || ""
      }`}
    >
      <p className="m-0 flex-1 italic text-[3.5cqw] font-serif text-pretty font-bold text-white">
        &quot;{text}&quot;
      </p>
      {(metaText || metaLink) && (
        <div className="flex items-center gap-2 text-[1em] text-white/60">
          {metaText && <span>{metaText}</span>}
          {/* {metaLink && (
            <a
              href={metaLink}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:text-white"
            >
              View
            </a>
          )} */}
        </div>
      )}
    </div>
  );
}
