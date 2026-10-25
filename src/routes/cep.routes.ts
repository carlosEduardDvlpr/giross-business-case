import { Router } from "express";
import { findNearbyCepsController } from "../controllers/find-nearby-ceps.controller.js";
import { deleteCacheCepController } from "../controllers/delete-cache-cep.controller.js";

const cepRouter = Router();

cepRouter.get("/ceps-proximos/:cep", findNearbyCepsController);
cepRouter.delete("/cache/:cep", deleteCacheCepController);

export default cepRouter;
