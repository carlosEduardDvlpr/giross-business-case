import type { Request, Response } from "express";
import { findNearbyCeps } from "../services/find-nearby-ceps.js";
import { getCepCoordinates } from "../services/get-cep-coordinates.js";
import { normalizeCep } from "../utils/cep.js";

export async function findNearbyCepsController(
  req: Request<{ cep: string }>,
  res: Response,
) {
  const cep = normalizeCep(req.params.cep);
  const coordinates = await getCepCoordinates(cep);
  const nearbyCeps = await findNearbyCeps(cep, coordinates);

  return res.status(200).json(nearbyCeps);
}
