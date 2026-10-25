import type { Request, Response } from "express";
import { findNearbyCeps } from "../services/find-nearby-ceps.js";
import { getCepCoordinates } from "../services/get-cep-coordinates.js";
import { normalizeCep } from "../utils/cep.js";
import { parseBooleanQuery } from "../utils/query.js";

export async function findNearbyCepsController(
  req: Request<{ cep: string }>,
  res: Response,
) {
  const cep = normalizeCep(req.params.cep);
  const isComplete = parseBooleanQuery(req.query.completo, "completo");

  const coordinates = await getCepCoordinates(cep);
  const nearbyCeps = await findNearbyCeps(cep, coordinates);

  const response = isComplete
    ? nearbyCeps
    : nearbyCeps.map((nearbyCep) => ({
        cep: nearbyCep.cep,
        distancia_km: nearbyCep.distancia_km,
      }));

  return res.status(200).json(response);
}
