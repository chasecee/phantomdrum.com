import { NextRequest, NextResponse } from "next/server";
import { getSharesIndex } from "@/app/lib/shareIndex";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const rawLimit = Number(limitParam ?? "6");
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 6;

  try {
    const entries = await getSharesIndex(200);

    const reviews = entries.map((entry) => ({
      sentence: entry.sentence,
      shareUrl: `${request.nextUrl.origin}/share/${entry.shareId}`,
      imageUrl: entry.imageUrl,
      uploadedAt: entry.uploadedAt,
    }));

    return NextResponse.json({ reviews: reviews.slice(0, limit) });
  } catch (error) {
    console.error("Failed to get reviews:", error);
    let errorMessage = "Failed to retrieve reviews";
    if (error instanceof Error) {
      if (
        error.message.includes("token") ||
        error.message.includes("UPSTASH") ||
        error.message.includes("redis")
      ) {
        errorMessage =
          "Upstash Redis not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.";
      } else {
        errorMessage = error.message;
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
