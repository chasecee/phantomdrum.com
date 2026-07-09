import type { APIRoute } from "astro";
import { loadShareMetadata } from "@/app/lib/shareMetadata";

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return json({ error: "Share not found" }, 404);
  }

  try {
    const metadata = await loadShareMetadata(id);
    return json(metadata);
  } catch (error) {
    console.error("Failed to load share metadata:", error);
    return json({ error: "Share not found" }, 404);
  }
};
