import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { consumeRateLimit } from "../lib/rate-limit.js";

const WINDOW_IN_SECONDS = 60;

export function rateLimit(name: string, limitPerMinute: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await consumeRateLimit(
      `rate-limit:${name}:${req.ip ?? "desconhecido"}`,
      limitPerMinute,
      WINDOW_IN_SECONDS,
    );

    if (!result) {
      return next();
    }

    res.set({
      "RateLimit-Limit": String(result.limit),
      "RateLimit-Remaining": String(result.remaining),
      "RateLimit-Reset": String(result.resetInSeconds),
    });

    if (!result.allowed) {
      throw new AppError(
        429,
        "Muitas requisições",
        `Limite de ${limitPerMinute} requisições por minuto atingido. Tente novamente em ${result.resetInSeconds} segundos.`,
        result.resetInSeconds,
      );
    }

    next();
  };
}
