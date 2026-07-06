import type { Metadata } from "next";
import { Suspense } from "react";
import SentenceCubeSection from "@/app/components/sections/SentenceCubeSection";

export const metadata: Metadata = {
  title: "Sentence Cubes",
  robots: { index: false },
};

export default function SentenceCubesEmbedPage() {
  return (
    <main className="min-h-dvh w-full">
      <Suspense fallback={null}>
        <SentenceCubeSection variant="embed" />
      </Suspense>
    </main>
  );
}
