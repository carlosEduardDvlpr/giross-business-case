import { AppError } from "../errors/app-error.js";
import { redis } from "./redis.js";

export const COORDINATES_CACHE_TTL_IN_SECONDS = 60 * 60 * 24 * 7;
export const NEARBY_CEPS_CACHE_TTL_IN_SECONDS = 60 * 60 * 24;

export const cacheKeys = {
  coordinates: (cep: string) => `cepAwesomeApi:${cep}`,
  nearbyCeps: (cep: string) => `nearbyCeps:${cep}`,
};

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    console.error("Cache: falha ao ler", key, String(error));
    return null;
  }
}

export async function setCache(
  key: string,
  value: unknown,
  ttlInSeconds: number,
) {
  try {
    await redis.set(key, JSON.stringify(value), { EX: ttlInSeconds });
  } catch (error) {
    console.error("Cache: falha ao gravar", key, String(error));
  }
}

export async function deleteCache(cep: string) {
  try {
    return await redis.del([
      cacheKeys.coordinates(cep),
      cacheKeys.nearbyCeps(cep),
    ]);
  } catch (error) {
    console.error("Cache: falha ao remover", cep, String(error));
    throw new AppError(
      503,
      "Cache indisponível",
      "Não foi possível limpar o cache agora. Tente novamente mais tarde.",
    );
  }
}
