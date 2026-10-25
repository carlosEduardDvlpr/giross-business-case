import { Router } from "express";
import { env } from "../config/env.js";
import { findNearbyCepsController } from "../controllers/find-nearby-ceps.controller.js";
import { deleteCacheCepController } from "../controllers/delete-cache-cep.controller.js";
import { rateLimit } from "../middlewares/rate-limit.js";

const cepRouter = Router();

cepRouter.get(
  "/ceps-proximos/:cep",
  rateLimit("ceps-proximos", env.apiRateLimitPerMinute),
  findNearbyCepsController,
);
cepRouter.delete(
  "/cache/:cep",
  rateLimit("cache", env.cacheDeleteRateLimitPerMinute),
  deleteCacheCepController,
);

export default cepRouter;
