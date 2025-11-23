import { NextRequest, NextResponse } from "next/server";
import { loadShareMetadata, type ShareMetadata } from "@/app/lib/shareMetadata";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const metadata = await loadShareMetadata(id);
    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Failed to load share metadata:", error);
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }
}
