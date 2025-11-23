import { head } from "@vercel/blob";

export type ShareMetadata = {
  shareId: string;
  sentence: string;
  createdAt: string;
  imagePath: string;
  imageUrl: string;
  words?: string[];
};

export async function loadShareMetadata(
  shareId: string
): Promise<ShareMetadata> {
  const metadataHead = await head(`shares/meta/${shareId}.json`);
  const response = await fetch(metadataHead.downloadUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch share metadata");
  }
  return response.json();
}
