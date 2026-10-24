import type { Request, Response } from "express";
import { BASE_URL } from "../lib/api_cep/base-url.js";

export async function getCeps(req: Request, res: Response) {
  const { cep } = req.params as { cep: string };

  const cepRegex = /^[0-9]{8}$/;

  if (!cepRegex.test(cep)) {
    return res.status(400).json({
      message: "CEP inválido. O CEP deve conter 8 dígitos.",
    });
  }

  const response = await fetch(BASE_URL + cep);
  if (!response.ok) {
    return res.status(500).json({
      message: "Erro ao buscar o CEP.",
    });
  }

  const data = await response.json();
  if (data.erro) {
    return res.status(404).json({
      message: `CEP ${cep} não encontrado.`,
    });
  }

  return res.status(200).json(data);
}
