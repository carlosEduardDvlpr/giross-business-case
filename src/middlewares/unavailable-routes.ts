import { Request, Response } from "express";

export function unavailableRoutesMiddleware(req: Request, res: Response) {
  return res.status(404).json({
    erro: "Rota não encontrada",
    mensagem: `A rota ${req.method} ${req.originalUrl} não está disponível.`,
  });
}
