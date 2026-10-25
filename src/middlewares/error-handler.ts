import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      erro: error.title,
      mensagem: error.message,
    });
  }

  // O Express lança URIError quando a URL tem um "%" inválido (ex: /ceps-proximos/%)
  if (error instanceof URIError) {
    return res.status(400).json({
      erro: "Requisição inválida",
      mensagem: "A URL informada contém caracteres inválidos.",
    });
  }

  console.error(error);

  return res.status(500).json({
    erro: "Erro interno do servidor",
    mensagem: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
  });
}
