import type { Metadata } from "next";
import { loadShareMetadata } from "@/app/lib/shareMetadata";

interface ShareLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

function deslugify(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: ShareLayoutProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const metadata = await loadShareMetadata(id);
    const sentence = metadata.sentence || deslugify(id);
    const title = sentence || "Sentence cube";
    const description = `${sentence}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: metadata.imageUrl,
            width: 1200,
            height: 1200,
            alt: sentence,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [metadata.imageUrl],
      },
    };
  } catch {
    return {
      title: "Share not found",
    };
  }
}

export default function ShareLayout({ children }: ShareLayoutProps) {
  return children;
}
