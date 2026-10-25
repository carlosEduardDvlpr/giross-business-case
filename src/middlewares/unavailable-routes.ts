import { Request, Response } from "express";

export function unavailableRoutes(req: Request, res: Response) {
  return res.status(404).json({
    erro: "Rota não encontrada",
    mensagem: `A rota ${req.method} ${req.originalUrl} não está disponível.`,
  });
}
