import type { APIRoute } from "astro";
import { getSharesIndex } from "@/app/lib/shareIndex";

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const rawLimit = Number(limitParam ?? "6");
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 6;

  try {
    const entries = await getSharesIndex(200);
    const reviews = entries.map((entry) => ({
      sentence: entry.sentence,
      shareUrl: `${url.origin}/share/${entry.shareId}`,
      imageUrl: entry.imageUrl,
      uploadedAt: entry.uploadedAt,
    }));
    return json({ reviews: reviews.slice(0, limit) });
  } catch (error) {
    console.error("Failed to get reviews:", error);
    if (
      error instanceof Error &&
      (error.message.includes("token") ||
        error.message.includes("UPSTASH") ||
        error.message.includes("redis"))
    ) {
      return json(
        {
          error:
            "Upstash Redis not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
        },
        500
      );
    }
    const errorMessage = error instanceof Error ? error.message : "Failed to retrieve reviews";
    return json({ error: errorMessage }, 500);
  }
};
