import { prisma } from "../lib/prisma.js";

export async function findNearbyCeps(
  latitude: number,
  longitude: number,
  cep: string,
  radioMetros: number = 1000,
) {
  interface NearbyCep {
    cep: string;
    distancia_km: number;
  }

  const ceps = await prisma.$queryRaw<NearbyCep[]>`
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
    c.logradouro,
    c.bairro,
    c.cidade,
    c.estado,
    ROUND(
      (ST_Distance(c.location, o.location) / 1000)::numeric,
      2
    )::double precision AS distancia_km
  FROM ceps AS c
  CROSS JOIN origem AS o
  WHERE ST_DWithin(
    c.location,
    o.location,
    ${radioMetros}::double precision
  )
  AND c.cep <> ${cep}
  ORDER BY
    ST_Distance(c.location, o.location),
    c.cep;
`;

  return ceps;
}
