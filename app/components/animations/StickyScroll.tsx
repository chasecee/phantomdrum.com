"use client";

import { ReactNode } from "react";

interface StickyScrollProps {
  children: ReactNode;
}

export default function StickyScroll({ children }: StickyScrollProps) {
  return <div className="sticky top-0 w-full">{children}</div>;
}
