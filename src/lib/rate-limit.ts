import { redis } from "./redis.js";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowInSeconds: number,
): Promise<RateLimitResult | null> {
  if (!redis.isReady) {
    console.error("Rate limit: Redis indisponível, requisição liberada", key);
    return null;
  }

  try {
    const [count, , ttl] = await redis
      .multi()
      .incr(key)
      .expire(key, windowInSeconds, "NX")
      .ttl(key)
      .execTyped();

    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetInSeconds: ttl > 0 ? ttl : windowInSeconds,
    };
  } catch (error) {
    console.error(
      "Rate limit: Redis indisponível, requisição liberada",
      key,
      String(error),
    );
    return null;
  }
}
