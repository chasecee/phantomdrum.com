import { Redis } from "@upstash/redis";
import type { ShareMetadata } from "./shareMetadata";

const getRedis = () => {
  try {
    const url =
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.STORAGE_KV_REST_API_URL;
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.STORAGE_KV_REST_API_TOKEN;

    if (url && token) {
      return new Redis({
        url,
        token,
      });
    }

    return Redis.fromEnv();
  } catch {
    return null;
  }
};

const SHARES_INDEX_KEY = "shares:index";
const SHARE_METADATA_PREFIX = "share:";

export type ShareIndexEntry = {
  shareId: string;
  sentence: string;
  imageUrl: string;
  uploadedAt: string;
};

export async function addShareToIndex(metadata: ShareMetadata): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  const entry: ShareIndexEntry = {
    shareId: metadata.shareId,
    sentence: metadata.sentence,
    imageUrl: metadata.imageUrl,
    uploadedAt: metadata.createdAt,
  };

  const score = new Date(metadata.createdAt).getTime();
  const metadataKey = `${SHARE_METADATA_PREFIX}${metadata.shareId}`;

  await Promise.all([
    redis.zadd(SHARES_INDEX_KEY, { score, member: metadata.shareId }),
    redis.set(metadataKey, entry),
  ]);
}

export async function getSharesIndex(
  limit: number = 200
): Promise<ShareIndexEntry[]> {
  const redis = getRedis();
  if (!redis) {
    return [];
  }

  try {
    const shareIds = await redis.zrange<string>(
      SHARES_INDEX_KEY,
      -limit,
      -1,
      { rev: true }
    );

    if (shareIds.length === 0) {
      return [];
    }

    const entries = await Promise.all(
      shareIds.map(async (shareId) => {
        const entry = await redis.get<ShareIndexEntry>(
          `${SHARE_METADATA_PREFIX}${shareId}`
        );
        return entry;
      })
    );

    return entries.filter(
      (entry): entry is ShareIndexEntry => entry !== null
    );
  } catch (error) {
    console.error("Failed to get shares index from Redis:", error);
    return [];
  }
}

