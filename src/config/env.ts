import "dotenv/config";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} não foi definida.`);
  }

  return value;
}

function getPositiveIntegerEnv(name: string, defaultValue: number) {
  const value = process.env[name];

  if (!value) {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} deve ser um número inteiro positivo.`);
  }

  return parsedValue;
}

export const env = {
  port: getPositiveIntegerEnv("PORT", 3000),
  databaseUrl: getRequiredEnv("DATABASE_URL"),
  geocodingApiUrl:
    process.env.GEOCODING_API_URL || "https://cep.awesomeapi.com.br/json/",
  geocodingTimeoutMs: getPositiveIntegerEnv("GEOCODING_TIMEOUT_MS", 5_000),
  redisUrl: getRequiredEnv("REDIS_URL"),
};
