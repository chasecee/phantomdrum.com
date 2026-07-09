import type { APIRoute } from "astro";
import { put } from "@vercel/blob";
import { normalizeSentenceForSharing } from "@/app/lib/sentenceUtils";
import { loadShareMetadata } from "@/app/lib/shareMetadata";
import { addShareToIndex } from "@/app/lib/shareIndex";

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<br\s*\/?>/gi, "-")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const blobToken =
      import.meta.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return json(
        {
          error:
            "Blob storage not configured in runtime. Missing BLOB_READ_WRITE_TOKEN.",
        },
        500
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const sentence = formData.get("sentence") as string | null;

    if (!imageFile) {
      return json({ error: "Image file is required" }, 400);
    }
    if (!sentence) {
      return json({ error: "Sentence is required" }, 400);
    }

    const normalizedSentence = normalizeSentenceForSharing(sentence);
    if (!normalizedSentence) {
      return json({ error: "Sentence is required" }, 400);
    }

    const shareId = slugify(normalizedSentence) || "share";

    try {
      const now = new Date();
      const datePath = `${now.getFullYear()}/${String(
        now.getMonth() + 1
      ).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
      const BLOB_EXTENSION = ".jpg";
      let existingMetadata: Awaited<ReturnType<typeof loadShareMetadata>> | null =
        null;
      try {
        existingMetadata = await loadShareMetadata(shareId);
      } catch {
        existingMetadata = null;
      }
      const defaultImagePath = `shares/${datePath}/${shareId}${BLOB_EXTENSION}`;
      const imagePath = existingMetadata?.imagePath ?? defaultImagePath;
      const blob = await put(imagePath, imageFile, {
        token: blobToken,
        access: "public",
        addRandomSuffix: false,
        contentType: "image/jpeg",
        allowOverwrite: true,
      });

      const origin = new URL(request.url).origin;
      const shareUrl = `${origin}/share/${shareId}`;
      const wordsField = formData.get("words") as string | null;
      let words: string[] | undefined;
      if (wordsField) {
        try {
          const parsed = JSON.parse(wordsField);
          if (Array.isArray(parsed)) {
            words = parsed.map((item) => String(item));
          }
        } catch {
          words = undefined;
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
            token: blobToken,
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

      return json({
        shareId,
        shareUrl,
        imageUrl: blob.url,
        sentence: normalizedSentence,
      });
    } catch (blobError) {
      console.error("Vercel Blob error:", blobError);
      if (
        blobError instanceof Error &&
        (blobError.message.includes("token") || blobError.message.includes("BLOB"))
      ) {
        return json(
          {
            error:
              "Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.",
          },
          500
        );
      }
      throw blobError;
    }
  } catch (error) {
    console.error("Error uploading share:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return json({ error: `Failed to upload share: ${errorMessage}` }, 500);
  }
};
