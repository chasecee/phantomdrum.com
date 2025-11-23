import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { normalizeSentenceForSharing } from "@/app/lib/sentenceUtils";
import { loadShareMetadata } from "@/app/lib/shareMetadata";
import { addShareToIndex } from "@/app/lib/shareIndex";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<br\s*\/?>/gi, "-")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const sentence = formData.get("sentence") as string;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    if (!sentence) {
      return NextResponse.json(
        { error: "Sentence is required" },
        { status: 400 }
      );
    }

    const normalizedSentence = normalizeSentenceForSharing(sentence);

    if (!normalizedSentence) {
      return NextResponse.json(
        { error: "Sentence is required" },
        { status: 400 }
      );
    }

    const shareId = slugify(normalizedSentence) || "share";

    try {
      const now = new Date();
      const datePath = `${now.getFullYear()}/${String(
        now.getMonth() + 1
      ).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
      const BLOB_EXTENSION = ".jpg";
      let existingMetadata: Awaited<
        ReturnType<typeof loadShareMetadata>
      > | null = null;
      try {
        existingMetadata = await loadShareMetadata(shareId);
      } catch {
        existingMetadata = null;
      }
      const defaultImagePath = `shares/${datePath}/${shareId}${BLOB_EXTENSION}`;
      const imagePath = existingMetadata?.imagePath ?? defaultImagePath;
      const blob = await put(imagePath, imageFile, {
        access: "public",
        addRandomSuffix: false,
        contentType: "image/jpeg",
        allowOverwrite: true,
      });

      const shareUrl = `${request.nextUrl.origin}/share/${shareId}`;
      const wordsField = formData.get("words") as string | null;
      let words: string[] | undefined;
      if (wordsField) {
        try {
          const parsed = JSON.parse(wordsField);
          if (Array.isArray(parsed)) {
            words = parsed.map((item) => String(item));
          }
        } catch {
          // ignore
        }
      }
      const metadataPayload = {
        shareId,
        sentence: normalizedSentence,
        createdAt: now.toISOString(),
        imagePath,
        imageUrl: blob.url,
        words,
      };
      const metadataBlob = new Blob([JSON.stringify(metadataPayload)], {
        type: "application/json",
      });
      try {
        await Promise.all([
          put(`shares/meta/${shareId}.json`, metadataBlob, {
            access: "public",
            addRandomSuffix: false,
            contentType: "application/json",
            allowOverwrite: true,
          }),
          addShareToIndex(metadataPayload),
        ]);
      } catch (metadataError) {
        console.error("Failed to write share metadata:", metadataError);
      }

      return NextResponse.json({
        shareId,
        shareUrl,
        imageUrl: blob.url,
        sentence: normalizedSentence,
      });
    } catch (blobError) {
      console.error("Vercel Blob error:", blobError);
      if (blobError instanceof Error) {
        if (
          blobError.message.includes("token") ||
          blobError.message.includes("BLOB")
        ) {
          return NextResponse.json(
            {
              error:
                "Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.",
            },
            { status: 500 }
          );
        }
      }
      throw blobError;
    }
  } catch (error) {
    console.error("Error uploading share:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to upload share: ${errorMessage}` },
      { status: 500 }
    );
  }
}
