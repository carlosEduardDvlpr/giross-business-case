import type { Request, Response } from "express";
import { findNearbyCeps } from "../services/find-nearby-ceps.js";
import { API_CEP_BASE_URL, CepResponse } from "../lib/api-cep.js";

export async function FindNearbyCepsController(req: Request, res: Response) {
  const { cep } = req.params as { cep: string };

  if (!/^[0-9]{8}$/.test(cep)) {
    return res.status(400).json({
      erro: "CEP inválido",
      mensagem:
        "O CEP fornecido não é válido. Certifique-se de fornecer um CEP com 8 dígitos numéricos.",
    });
  }

  let response;

  try {
    response = await fetch(`${API_CEP_BASE_URL}${cep}`, {
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    return res.status(503).json({
      erro: "Serviço de geolocalização indisponível",
      mensagem:
        "O serviço de geolocalização está temporariamente indisponível. Tente novamente mais tarde.",
    });
  }

  if (response.status === 404) {
    return res.status(404).json({
      erro: "CEP não encontrado",
      mensagem:
        "O CEP fornecido não foi encontrado. Verifique o CEP e tente novamente.",
    });
  }

  if (!response.ok) {
    return res.status(500).json({
      erro: "Erro ao consultar o serviço de geolocalização",
      mensagem:
        "Ocorreu um erro ao consultar o serviço de geolocalização. Tente novamente mais tarde.",
    });
  }

  const data = (await response.json()) as CepResponse;
  const latitude = Number(data.lat);
  const longitude = Number(data.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(500).json({
      erro: "Erro ao processar coordenadas",
      mensagem:
        "O serviço retornou coordenadas inválidas. Tente novamente mais tarde.",
    });
  }

  const ceps = await findNearbyCeps(latitude, longitude, cep);

  return res.status(200).json(ceps);
}
