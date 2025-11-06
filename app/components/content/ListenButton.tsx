import React from "react";
import Link from "next/link";

interface ListenButtonProps {
  text: string;
  href: string;
  color: string;
}

export default function ListenButton({ text, href, color }: ListenButtonProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="aspect-3/1 w-full border-[clamp(2px,2vw,1px)] border-solid font-mono font-bold uppercase text-[5vw] leading-[1.2] flex items-center justify-center transition-opacity hover:opacity-80"
      style={{
        borderColor: color,
        color: color,
      }}
    >
      <span className="text-current">{text}</span>
    </Link>
  );
}
