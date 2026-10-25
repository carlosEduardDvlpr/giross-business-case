import { prisma } from "../lib/prisma.js";
import type { Coordinates } from "./get-cep-coordinates.js";

const SEARCH_RADIUS_IN_METERS = 1000;

export interface NearbyCep {
  cep: string;
  distancia_km: number;
}

export async function findNearbyCeps(
  cep: string,
  { latitude, longitude }: Coordinates,
): Promise<NearbyCep[]> {
  return prisma.$queryRaw<NearbyCep[]>`
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
    )::double precision AS distancia_km
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
}
