import { NextResponse } from "next/server";
import sentencePacks from "@/config/sentencePacks.generated";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export async function GET() {
  return NextResponse.json({ sentencePacks }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
