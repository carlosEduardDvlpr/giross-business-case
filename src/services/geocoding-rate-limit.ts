import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { consumeRateLimit } from "../lib/rate-limit.js";
import { redis } from "../lib/redis.js";

const WINDOW_IN_SECONDS = 60;
const RATE_LIMIT_KEY = "rate-limit:geocoding";
const PAUSE_KEY = "rate-limit:geocoding:pause";
const DEFAULT_PAUSE_IN_SECONDS = 60;
const MAX_PAUSE_IN_SECONDS = 60 * 60;

function quotaExceededError(retryAfterInSeconds: number) {
  return new AppError(
    503,
    "Serviço de geolocalização indisponível",
    "O limite de consultas ao serviço de geolocalização foi atingido. Tente novamente em instantes.",
    retryAfterInSeconds,
  );
}

export async function checkGeocodingRateLimit() {
  const pausedForSeconds = await getPauseTtl();

  if (pausedForSeconds > 0) {
    throw quotaExceededError(pausedForSeconds);
  }

  const result = await consumeRateLimit(
    RATE_LIMIT_KEY,
    env.geocodingRateLimitPerMinute,
    WINDOW_IN_SECONDS,
  );

  if (result && !result.allowed) {
    throw quotaExceededError(result.resetInSeconds);
  }
}

export async function pauseGeocoding(retryAfterHeader: string | null) {
  const seconds = parseRetryAfter(retryAfterHeader) ?? DEFAULT_PAUSE_IN_SECONDS;

  try {
    await redis.set(PAUSE_KEY, "1", { EX: seconds });
  } catch (error) {
    console.error("Rate limit: falha ao pausar o geocoding", String(error));
  }

  return seconds;
}

async function getPauseTtl() {
  try {
    return await redis.ttl(PAUSE_KEY);
  } catch {
    return 0;
  }
}

function parseRetryAfter(value: string | null) {
  const seconds = Number(value);

  if (!Number.isInteger(seconds) || seconds <= 0) {
    return null;
  }

  return Math.min(seconds, MAX_PAUSE_IN_SECONDS);
}
