import { Router } from "express";
import { findNearbyCepsController } from "../controllers/find-nearby-ceps.controller.js";

const cepRouter = Router();

cepRouter.get("/ceps-proximos/:cep", findNearbyCepsController);

export default cepRouter;
