import { head, list } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

function deslugify(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const rawLimit = Number(limitParam ?? "6");
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 6;

  try {
    const { blobs } = await list({
      prefix: "shares/",
      limit: 200,
    });

    const imageBlobs = blobs.filter((blob) =>
      /\.(png|jpe?g)$/i.test(blob.pathname)
    );
    const reviews = await Promise.all(
      imageBlobs.map(async (blob) => {
        const fileName = blob.pathname.split("/").pop() ?? "";
        const shareId = fileName.replace(/\.(png|jpe?g)$/i, "");
        let sentence = deslugify(shareId);

        try {
          const metadataHead = await head(`shares/meta/${shareId}.json`);
          const metadataResponse = await fetch(metadataHead.downloadUrl);
          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            if (typeof metadata?.sentence === "string" && metadata.sentence) {
              sentence = metadata.sentence;
            }
          }
        } catch {
          // metadata missing or unreadable, fall back to slug-derived text
        }

        return {
          sentence,
          shareUrl: blob.url,
          imageUrl: blob.downloadUrl,
          uploadedAt: blob.uploadedAt.toISOString(),
        };
      })
    );

    reviews.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({ reviews: reviews.slice(0, limit) });
  } catch (error) {
    console.error("Failed to list reviews:", error);
    let errorMessage = "Failed to retrieve reviews";
    if (error instanceof Error) {
      if (error.message.includes("token") || error.message.includes("BLOB")) {
        errorMessage =
          "Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN.";
      } else {
        errorMessage = error.message;
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
