import { createClient } from "redis";
import { env } from "../config/env.js";

export const redis = createClient({
  url: env.redisUrl,
  disableOfflineQueue: true,
});

redis.on("error", (error: NodeJS.ErrnoException) => {
  console.error("Redis:", error.message || error.code);
});

redis.on("ready", () => {
  console.log("Redis connected");
});
