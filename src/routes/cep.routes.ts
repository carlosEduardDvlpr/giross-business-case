import { Router } from "express";
import { FindNearbyCepsController } from "../controllers/find-nearby-ceps.controller.js";

const cepRouter = Router();

cepRouter.get("/ceps-proximos/:cep", FindNearbyCepsController);

export default cepRouter;
