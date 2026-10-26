import { prisma } from "../lib/prisma.js";
import type { Coordinates } from "./get-cep-coordinates.js";
import {
  cacheKeys,
  getCache,
  NEARBY_CEPS_CACHE_TTL_IN_SECONDS,
  setCache,
} from "../lib/cache.js";

const SEARCH_RADIUS_IN_METERS = 1000;

export interface NearbyCep {
  cep: string;
  distancia_km: number;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export async function findNearbyCeps(
  cep: string,
  { latitude, longitude }: Coordinates,
): Promise<NearbyCep[]> {
  const cacheKey = cacheKeys.nearbyCeps(cep);
  const cachedNearbyCeps = await getCache<NearbyCep[]>(cacheKey);

  if (Array.isArray(cachedNearbyCeps)) {
    return cachedNearbyCeps;
  }

  const nearbyCeps = await prisma.$queryRaw<NearbyCep[]>`
  WITH origem AS (
    SELECT
      ST_SetSRID(
        ST_MakePoint(
          ${longitude}::double precision,
          ${latitude}::double precision
        ),
        4326
      )::geography AS location
  )
  SELECT
    c.cep,
    ROUND(
      (ST_Distance(c.location, o.location) / 1000)::numeric,
      2
    )::double precision AS distancia_km,
    c.logradouro,
    c.bairro,
    c.cidade,
    c.estado
  FROM ceps AS c
  CROSS JOIN origem AS o
  WHERE ST_DWithin(
    c.location,
    o.location,
    ${SEARCH_RADIUS_IN_METERS}::double precision
  )
  AND c.cep <> ${cep}
  ORDER BY
    ST_Distance(c.location, o.location),
    c.cep;
`;

  await setCache(cacheKey, nearbyCeps, NEARBY_CEPS_CACHE_TTL_IN_SECONDS);

  return nearbyCeps;
}
