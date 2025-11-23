import Head from "next/head";
import { notFound } from "next/navigation";
import { loadShareMetadata } from "@/app/lib/shareMetadata";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

interface SharePageMetadataParams {
  params: { id: string };
}

export const dynamic = "force-dynamic";

function deslugify(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://phantomdrum.com";

export async function generateMetadata({ params }: SharePageMetadataParams) {
  try {
    const metadata = await loadShareMetadata(params.id);
    const title = metadata.sentence || "Sentence Cube";
    const shareUrl = `${BASE_URL}/share/${params.id}`;
    return {
      title,
      openGraph: {
        title,
        images: [{ url: metadata.imageUrl }],
        url: shareUrl,
      },
      twitter: {
        title,
        images: [metadata.imageUrl],
        card: "summary_large_image",
      },
    };
  } catch {
    return {
      title: "Sentence Cube",
    };
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  const metadata = await loadShareMetadata(id).catch(() => null);
  if (!metadata) {
    notFound();
  }
  const sentence = metadata.sentence || deslugify(id);

  const redirectUrl = `/?share=${id}`;
  const script = `
    if (typeof window !== "undefined") {
      window.location.replace("${redirectUrl}");
    }
  `;

  return (
    <>
      <Head>
        <meta name="robots" content="index,follow" />
        <meta property="og:image" content={metadata.imageUrl} />
        <meta property="twitter:image" content={metadata.imageUrl} />
        <meta property="og:title" content={sentence} />
        <meta property="og:url" content={`${BASE_URL}/share/${id}`} />
        <meta property="og:type" content="website" />
      </Head>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="mx-auto w-full max-w-3xl text-center space-y-4">
          <p className="text-4xl font-bold text-white">
            Redirecting to the sentence cube
          </p>
          <p className="text-lg text-white/80">
            Hang tight while we bring you back to the interactive experience.
          </p>
          <h1 className="text-sm uppercase tracking-[0.5em] text-white/60">
            {sentence}
          </h1>
          <a
            href={redirectUrl}
            className="inline-block px-4 py-2 uppercase tracking-[0.4em] text-sm border border-white/40 rounded"
          >
            Continue to homepage
          </a>
        </div>
        <script dangerouslySetInnerHTML={{ __html: script }} />
      </div>
    </>
  );
}
