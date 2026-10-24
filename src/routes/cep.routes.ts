import { Router } from "express";
import { getCeps } from "../controllers/cep.controller.js";

const cepRouter = Router();

cepRouter.get("/ceps-proximos/:cep", getCeps);

export default cepRouter;
