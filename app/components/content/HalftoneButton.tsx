"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

interface HalftoneButtonProps {
  text: string;
  href: string;
  color: string;
}

// Dynamically import the Three.js scene to prevent upfront bundling
const HalftoneButtonScene = dynamic(
  () => import(/* webpackChunkName: "three-components" */ "./HalftoneButtonScene"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60px]">
        <div className="text-white opacity-50">{/* Loading placeholder */}</div>
      </div>
    ),
  }
);

export default function HalftoneButton({ text, href, color }: HalftoneButtonProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60px]">
          <div className="text-white opacity-50">{/* Loading placeholder */}</div>
        </div>
      }
    >
      <HalftoneButtonScene text={text} href={href} color={color} />
    </Suspense>
  );
}
