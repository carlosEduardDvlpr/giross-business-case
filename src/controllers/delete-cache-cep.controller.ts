import type { Request, Response } from "express";
import { normalizeCep } from "../utils/cep.js";
import { deleteCache } from "../lib/cache.js";

export async function deleteCacheCepController(
  req: Request<{ cep: string }>,
  res: Response,
) {
  const cep = normalizeCep(req.params.cep);
  const removedKeys = await deleteCache(cep);

  return res.status(200).json({
    cep,
    mensagem:
      removedKeys > 0
        ? "Cache do CEP removido com sucesso."
        : "Não havia cache para este CEP.",
  });
}
